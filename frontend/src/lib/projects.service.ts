import { api } from './api';
import type { Project, CreateProjectDto, UpdateProjectDto, ProjectStats } from '@/types/project';

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
};
