'use client';

/**
 * RbacContext — Determines and exposes the current user's "effective global role".
 *
 * Architecture:
 *   - Roles are project-scoped in the DB (no global role in JWT).
 *   - To gate global UI (sidebar nav, create-project page, etc.) we fetch
 *     GET /projects/:id/permissions for ALL of the user's projects, then
 *     pick the highest-privilege role via getHighestRole().
 *   - This means a Manager in 9 projects whose newest project assigned them
 *     as Developer will still correctly see Manager-level UI.
 *
 * Usage:
 *   const { role, hasPermission, hasRole, isManager } = useRbac();
 *
 * Note: For project-workspace pages use usePermissions(projectId) from
 *       @/lib/hooks/usePermissions — it fetches the role for that specific project.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useProjects } from './ProjectsContext';
import { projectsService } from './projects.service';
import {
  hasPermission as staticHasPermission,
  hasRole as staticHasRole,
  getHighestRole,
  type AppRole,
  type Permission,
} from './permissions';

// ── Context shape ─────────────────────────────────────────────────────────────

interface RbacCtx {
  /** Role name as returned by backend (e.g. 'Manager', 'Developer', 'Client', 'SuperAdmin') */
  role: string | null;
  /** Flat list of permission strings for the role */
  permissions: string[];
  /** True while the initial permissions fetch is in flight */
  loading: boolean;
  /** True if the user has NO projects (new user — no role assigned yet) */
  noProjects: boolean;
  /** Checks a single permission against the resolved role */
  hasPermission: (permission: Permission) => boolean;
  /** Checks if the resolved role matches any of the given roles */
  hasRole: (...roles: AppRole[]) => boolean;
  // Convenience flags
  isSuperAdmin: boolean;
  isManager: boolean;
  isDeveloper: boolean;
  isClient: boolean;
  /** Manager or SuperAdmin — can manage teams, create tasks, etc. */
  canManage: boolean;
}

const RbacContext = createContext<RbacCtx | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function RbacProvider({ children }: { children: React.ReactNode }) {
  const { projects, loading: projectsLoading } = useProjects();

  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Stable key: rebuild when project list changes (login/logout/new project added)
  const projectIds = projects.map((p) => p.id);
  const projectIdsKey = projectIds.join(',');
  const noProjects = !projectsLoading && projects.length === 0;

  useEffect(() => {
    // Still waiting for ProjectsContext to fetch
    if (projectsLoading) return;

    // No projects → user has no assigned role yet (new registration)
    if (projectIds.length === 0) {
      setRole(null);
      setPermissions([]);
      setLoading(false);
      return;
    }

    // Fetch permissions for every project the user belongs to,
    // then pick the highest role across all of them.
    setLoading(true);
    Promise.all(
      projectIds.map((id) => projectsService.getPermissions(id).catch(() => null)),
    )
      .then((results) => {
        const valid = results.filter(Boolean) as { role: string; permissions: string[] }[];
        const allRoles = valid.map((r) => r.role).filter(Boolean) as string[];
        const allPerms = [...new Set(valid.flatMap((r) => r.permissions))];
        const highest = getHighestRole(allRoles);
        setRole(highest);
        setPermissions(allPerms);
      })
      .catch(() => {
        setRole(null);
        setPermissions([]);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdsKey, projectsLoading]);

  const value = useMemo<RbacCtx>(() => {
    const checkPermission = (permission: Permission) =>
      // Check against static map (fast) OR the live permissions array from backend
      staticHasPermission(role, permission) || permissions.includes(permission);

    const checkRole = (...roles: AppRole[]) => staticHasRole(role, ...roles);

    return {
      role,
      permissions,
      loading: loading || projectsLoading,
      noProjects,
      hasPermission: checkPermission,
      hasRole: checkRole,
      isSuperAdmin: role === 'SuperAdmin',
      isManager: role === 'Manager',
      isDeveloper: role === 'Developer',
      isClient: role === 'Client',
      canManage: role === 'Manager' || role === 'SuperAdmin',
    };
  }, [role, permissions, loading, projectsLoading, noProjects]);

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useRbac(): RbacCtx {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error('useRbac must be used inside <RbacProvider>');
  return ctx;
}
