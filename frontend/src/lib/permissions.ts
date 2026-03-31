/**
 * permissions.ts — Centralized RBAC permission definitions.
 *
 * This file is the single source of truth for which roles have which
 * permissions on the FRONTEND. It mirrors backend/prisma/seed.ts
 * ROLE_PERMISSIONS exactly, so UI gates always match backend guards.
 *
 * Rules:
 * - Do NOT check roles directly in components — use hasPermission() or hasRole()
 * - SuperAdmin bypasses all checks (mirrors PermissionGuard backend logic)
 * - Add new permissions here AND in the backend seed before using them
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppRole = 'SuperAdmin' | 'Manager' | 'Developer' | 'Client';

export type Permission =
  // Tasks
  | 'CREATE_TASK'
  | 'READ_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'MANAGE_TASKS'
  // Projects
  | 'VIEW_PROJECT'
  | 'UPDATE_PROJECT'
  | 'MANAGE_PROJECTS'
  // Teams
  | 'VIEW_TEAM'
  | 'MANAGE_TEAM'
  // Reports
  | 'VIEW_REPORTS'
  // Comments
  | 'ADD_COMMENT'
  | 'VIEW_COMMENT'
  | 'DELETE_COMMENT'
  // Users (SuperAdmin only)
  | 'MANAGE_USERS';

// ── Role → Permission map (mirrors seed.ts ROLE_PERMISSIONS) ─────────────────

/**
 * SuperAdmin is special: they bypass ALL permission checks on the backend.
 * On the frontend we grant them every permission explicitly so hasPermission()
 * always returns true for SuperAdmin.
 */
const ALL_PERMISSIONS: readonly Permission[] = [
  'CREATE_TASK', 'READ_TASK', 'UPDATE_TASK', 'DELETE_TASK', 'MANAGE_TASKS',
  'VIEW_PROJECT', 'UPDATE_PROJECT', 'MANAGE_PROJECTS',
  'VIEW_TEAM', 'MANAGE_TEAM',
  'VIEW_REPORTS',
  'ADD_COMMENT', 'VIEW_COMMENT', 'DELETE_COMMENT',
  'MANAGE_USERS',
];

export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  SuperAdmin: ALL_PERMISSIONS,

  // Manager mirrors SuperAdmin permissions but is scoped to their assigned project.
  // SuperAdmin = global scope; Manager = full control within their project.
  Manager: ALL_PERMISSIONS,

  Developer: [
    'READ_TASK', 'UPDATE_TASK',
    'VIEW_PROJECT',
    'VIEW_TEAM',
    'ADD_COMMENT', 'VIEW_COMMENT',
  ],

  Client: [
    'READ_TASK',
    'VIEW_PROJECT',
    'VIEW_COMMENT',
  ],
};

// ── Utility helpers ───────────────────────────────────────────────────────────

/**
 * Returns true if the given role has the given permission.
 * Falls back to false for null / unknown roles.
 */
export function hasPermission(
  role: string | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as AppRole];
  return perms?.includes(permission) ?? false;
}

/**
 * Returns true if the user's role is in the allowedRoles list.
 */
export function hasRole(
  userRole: string | null | undefined,
  ...allowedRoles: AppRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole as AppRole);
}

/**
 * Role priority for "highest privilege wins" resolution.
 * Used to determine the dominant role when a user has multiple projects.
 */
const ROLE_PRIORITY: Record<AppRole, number> = {
  SuperAdmin: 4,
  Manager: 3,
  Developer: 2,
  Client: 1,
};

/**
 * Given a list of role names, returns the one with the highest privilege.
 */
export function getHighestRole(roles: string[]): AppRole | null {
  if (!roles.length) return null;
  return roles.reduce<AppRole | null>((best, cur) => {
    const curPriority = ROLE_PRIORITY[cur as AppRole] ?? 0;
    const bestPriority = best ? (ROLE_PRIORITY[best] ?? 0) : -1;
    return curPriority > bestPriority ? (cur as AppRole) : best;
  }, null);
}
