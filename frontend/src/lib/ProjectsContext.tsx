'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsService } from './projects.service';
import { teamsService } from './teams.service';
import type { Project as ApiProject } from '@/types/project';

// ── Shared project shape used across all views ─────────────────────────────
export interface ParticipatingTeam {
  teamID: string;
  teamName: string;
  members: { name: string; avatar: string; color: string }[];
}

export interface MockProject {
  id: string;           // UUID (used for API calls)
  projectID: string;
  projectName: string;
  projectDescription?: string;
  /** 'assigned' | 'overdue' | 'completed' | 'todo' */
  status: string;
  /** 'In Progress' | 'Completed' | 'Overdue' | 'Pending' | 'To Do' */
  statusLabel: string;
  teamName: string;
  teamID?: string;
  assigneeName: string;
  assigneeAvatar: string;
  assigneeColor: string;
  assignedDate: string;
  dueDate: string;
  /** 'Critical' | 'Medium' | 'Low' */
  priority: string;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  tags?: string[];
  teamMembers?: { avatar: string; color: string; name: string }[];
  teams?: ParticipatingTeam[];
  /** Live RBAC members (from userRoles relation) — used for avatar row + member count */
  rbacMembers?: { userId: string; name: string; email: string; roleName: string }[];
  /** Issue count from the issues table */
  issueCount?: number;
  /** Current user's role in this project (RBAC) */
  userRole?: string;
}

// ── Helper: format ISO date to "Mar 10, 2026" ────────────────────────────────
function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── Map API Project → MockProject ─────────────────────────────────────────────
function mapApiToMock(p: ApiProject & {
  tags?: { tag: string }[];
  teams?: { teamID: string; teamName: string; members: { name: string; avatar: string; color: string }[] }[];
}): MockProject {
  return {
    id:                 p.id,
    projectID:          p.projectID,
    projectName:        p.projectName,
    projectDescription: p.projectDescription,
    status:             p.status,
    statusLabel:        p.statusLabel,
    teamName:           p.teams?.[0]?.teamName || (p.teamName !== 'Unassigned' ? p.teamName : '') || p.teamName,
    teamID:             p.teamID,
    assigneeName:       p.assigneeName,
    assigneeAvatar:     p.assigneeAvatar,
    assigneeColor:      p.assigneeAvatarColor,
    assignedDate:       fmtDate(p.assignedDate),
    dueDate:            fmtDate(p.dueDate),
    priority:           p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    progress:           p.metrics?.completionPercentage ?? 0,
    tasksTotal:         p.metrics?.tasksTotal ?? 0,
    tasksCompleted:     p.metrics?.tasksCompleted ?? 0,
    tags:               p.tags?.map((t) => t.tag),
    teamMembers:        p.teamMembers?.map((m) => ({ avatar: m.avatar, color: m.avatarColor, name: m.name })),
    teams:              p.teams?.map((t) => ({
      teamID:   t.teamID,
      teamName: t.teamName,
      members:  t.members ?? [],
    })),
    // Live RBAC members from userRoles relation
    rbacMembers: (p as any).userRoles?.map((ur: any) => ({
      userId:   ur.user?.id ?? ur.userId,
      name:     ur.user?.name ?? '',
      email:    ur.user?.email ?? '',
      roleName: ur.role?.name ?? '',
    })) ?? [],
    // Issue count from _count
    issueCount: (p as any)._count?.issues ?? 0,
    // Per-project role injected by the backend findMyProjects mapper
    userRole: (p as any).userRole,
  };
}

// ── Kanban column → DB status mapping ────────────────────────────────────────
const COLUMN_TO_STATUS: Record<string, { status: string; statusLabel: string }> = {
  todo:     { status: 'todo',        statusLabel: 'To Do' },
  progress: { status: 'in-progress', statusLabel: 'In Progress' },
  done:     { status: 'completed',   statusLabel: 'Completed' },
};

// ── Context ─────────────────────────────────────────────────────────────────
interface ProjectsCtx {
  projects: MockProject[];
  loading: boolean;
  addProject: (p: MockProject) => void;
  assignTeamToProject: (projectID: string, team: ParticipatingTeam) => Promise<void>;
  refreshProjects: () => Promise<void>;
  updateProjectStatus: (projectID: string, kanbanCol: string) => void;
}

const ProjectsContext = createContext<ProjectsCtx | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<MockProject[]>([]);
  const [loading, setLoading] = useState(true);
  // Track which user's projects are currently loaded.
  // When this changes (login / logout / user switch), trigger a fresh fetch.
  const [tokenKey, setTokenKey] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      // Not logged in — clear projects immediately
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Phase 3 RBAC: only fetch projects where the current user has a role
      const data = await projectsService.getMyProjects();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProjects((data as any[]).map(mapApiToMock));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever the stored token changes (login, logout, user switch).
  // Uses a storage event listener so it works across tabs too.
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    setTokenKey(token);
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      const token = localStorage.getItem('access_token');
      setTokenKey(token);
    };
    window.addEventListener('storage', handleStorage);
    // Also poll on focus — catches same-tab login/logout
    window.addEventListener('focus', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
    };
  }, []);

  // Fetch whenever tokenKey changes
  useEffect(() => { fetchProjects(); }, [fetchProjects, tokenKey]);

  const addProject = (p: MockProject) =>
    setProjects(prev => [p, ...prev]);

  const updateProjectStatus = useCallback((projectID: string, kanbanCol: string) => {
    const mapped = COLUMN_TO_STATUS[kanbanCol];
    if (!mapped) return;

    // Optimistic update — all views that read from context update instantly
    setProjects(prev => prev.map(p =>
      p.projectID === projectID
        ? { ...p, status: mapped.status, statusLabel: mapped.statusLabel }
        : p
    ));

    // Persist to backend (fire-and-forget; silent fail if offline)
    const project = projects.find(p => p.projectID === projectID);
    if (project?.id) {
      projectsService.update(project.id, { status: mapped.status, statusLabel: mapped.statusLabel })
        .catch(() => { /* backend offline — local state still updated */ });
    }
  }, [projects]);

  const assignTeamToProject = async (projectID: string, team: ParticipatingTeam) => {
    try {
      await teamsService.create({
        teamName: team.teamName,
        projectID,
        members: team.members,
      });
      // Refresh so project.teams[] reflects what's in DB
      await fetchProjects();
    } catch {
      // Offline fallback — update in-memory only
      setProjects(prev => prev.map(p =>
        p.projectID === projectID
          ? {
              ...p,
              teamName: team.teamName,
              teams: [...(p.teams ?? []).filter(t => t.teamID !== team.teamID), team],
            }
          : p
      ));
    }
  };

  return (
    <ProjectsContext.Provider value={{ projects, loading, addProject, assignTeamToProject, refreshProjects: fetchProjects, updateProjectStatus }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used inside <ProjectsProvider>');
  return ctx;
}

