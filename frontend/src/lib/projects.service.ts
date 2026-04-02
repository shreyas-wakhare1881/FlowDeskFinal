import { api } from './api';
import type { Project, CreateProjectDto, UpdateProjectDto, ProjectStats } from '@/types/project';
import type { TeamProgressEntry } from '@/types/issue';

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Shape returned by GET /projects/:id/permissions */
export interface ProjectPermissions {
  projectId: string;
  role: string | null;
  permissions: string[];
}

export const projectsService = {
  /**
   * Get all projects (unpaginated — returns full array for backward compat)
   */
  getAll: async (): Promise<Project[]> => {
    const res = await api.get<PaginatedResponse<Project>>('/projects');
    return res.data;
  },

  /**
   * Get paginated projects
   */
  getPaginated: async (page = 1, limit = 10): Promise<PaginatedResponse<Project>> => {
    return api.get<PaginatedResponse<Project>>(`/projects?page=${page}&limit=${limit}`);
  },

  /**
   * Get project by ID (UUID)
   */
  getById: async (id: string): Promise<Project> => {
    return api.get<Project>(`/projects/${id}`);
  },

  /**
   * Get project by Project ID (PRJ-XXX)
   */
  getByProjectID: async (projectID: string): Promise<Project> => {
    return api.get<Project>(`/projects/project-id/${projectID}`);
  },

  /**
   * Get project statistics
   */
  getStats: async (): Promise<ProjectStats> => {
    return api.get<ProjectStats>('/projects/stats');
  },

  /**
   * Create a new project
   */
  create: async (data: CreateProjectDto): Promise<Project> => {
    return api.post<Project>('/projects', data);
  },

  /**
   * Update a project
   */
  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    return api.put<Project>(`/projects/${id}`, data);
  },

  /**
   * Delete a project
   */
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/projects/${id}`);
  },

  // ── RBAC Methods (Phase 3) ─────────────────────────────────────────────────

  /**
   * Get only the projects where the current user has a role.
   * Replaces getAll() for the main dashboard view.
   * Calls: GET /projects/my
   */
  getMyProjects: async (): Promise<Project[]> => {
    const res = await api.get<{ data: Project[]; meta: { total: number } }>('/projects/my');
    return res.data;
  },

  /**
   * Get the current user's role + flat permission list for a specific project.
   * Call this when a user opens a project workspace.
   * Calls: GET /projects/:id/permissions
   */
  getPermissions: async (projectId: string): Promise<ProjectPermissions> => {
    return api.get<ProjectPermissions>(`/projects/${projectId}/permissions`);
  },

  /**
   * Get assignable roles (Manager, Developer, Client — NOT SuperAdmin).
   * Used to populate the role dropdown when assigning members.
   * Calls: GET /projects/roles
   */
  getRoles: async (): Promise<{ id: string; name: string; description: string }[]> => {
    return api.get<{ id: string; name: string; description: string }[]>('/projects/roles');
  },

  /**
   * Get existing members of a project (to show disabled state in assign UI).
   * Calls: GET /projects/:projectId/members
   */
  getMembers: async (
    projectId: string,
  ): Promise<{ userId: string; name: string; email: string; roleId: string; roleName: string }[]> => {
    return api.get(`/projects/${projectId}/members`);
  },

  /**
   * Assign a user to a project with a specific role (generic).
   * Requires MANAGE_TEAM permission (Manager or SuperAdmin).
   * Calls: POST /projects/:projectId/members
   */
  addMember: async (
    projectId: string,
    userId: string,
    roleId: string,
  ): Promise<{ userId: string; name: string; email: string; roleId: string; roleName: string }> => {
    return api.post(`/projects/${projectId}/members`, { userId, roleId });
  },

  /**
   * SuperAdmin assigns a user specifically as Manager in a project.
   * Calls: POST /projects/:projectId/assign-manager
   */
  assignManager: async (
    projectId: string,
    userId: string,
  ): Promise<{ userId: string; name: string; email: string; roleId: string; roleName: string }> => {
    return api.post(`/projects/${projectId}/assign-manager`, { userId });
  },

  /**
   * Remove a user from a project.
   * Calls: DELETE /projects/:projectId/members/:userId
   */
  removeMember: async (projectId: string, userId: string): Promise<void> => {
    return api.delete(`/projects/${projectId}/members/${userId}`);
  },

  /**
   * Search registered FlowDesk users by name or email (for Add People autocomplete).
   * Calls: GET /users?q=keyword
   */
  searchUsers: async (q: string): Promise<{ id: string; name: string; email: string }[]> => {
    return api.get<{ id: string; name: string; email: string }[]>(`/users?q=${encodeURIComponent(q)}`);
  },

  /**
   * Update an existing member's role in a project.
   * Calls: PUT /projects/:projectId/members/:userId
   */
  updateMemberRole: async (
    projectId: string,
    userId: string,
    roleId: string,
  ): Promise<{ userId: string; name: string; email: string; roleId: string; roleName: string }> => {
    return api.put(`/projects/${projectId}/members/${userId}`, { roleId });
  },

  /**
   * Get real-time team progress for a project.
   * Returns per-member task counts (total, done, in-progress, todo).
   * Calls: GET /projects/:id/progress
   */
  getProgress: async (projectId: string): Promise<TeamProgressEntry[]> => {
    return api.get<TeamProgressEntry[]>(`/projects/${projectId}/progress`);
  },
};
