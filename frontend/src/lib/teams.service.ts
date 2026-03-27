import { api } from './api';

export interface CreateTeamApiDto {
  teamName: string;
  projectID: string; // PRJ-001
  members: Array<{ name: string; avatar: string; color: string }>;
}

export interface ApiTeam {
  id: string;
  teamID: string;
  teamName: string;
  projectId: string;
  createdAt: string;
  members: Array<{ id: string; name: string; avatar: string; color: string; teamId: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const teamsService = {
  /** GET /api/teams?projectID=PRJ-001 — returns full array (backward compat) */
  getByProject(projectID: string): Promise<ApiTeam[]> {
    return api.get<PaginatedResponse<ApiTeam>>(`/teams?projectID=${encodeURIComponent(projectID)}`).then(res => res.data);
  },

  /** GET /api/teams — returns full array (backward compat) */
  getAll(): Promise<ApiTeam[]> {
    return api.get<PaginatedResponse<ApiTeam>>('/teams').then(res => res.data);
  },

  /** GET /api/teams?page=1&limit=10 — returns paginated */
  getPaginated(page = 1, limit = 10, projectID?: string): Promise<PaginatedResponse<ApiTeam>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (projectID) params.set('projectID', projectID);
    return api.get<PaginatedResponse<ApiTeam>>(`/teams?${params.toString()}`);
  },

  /** POST /api/teams */
  create(dto: CreateTeamApiDto): Promise<ApiTeam> {
    return api.post<ApiTeam>('/teams', dto);
  },

  /** DELETE /api/teams/:id */
  delete(id: string): Promise<void> {
    return api.delete<void>(`/teams/${id}`);
  },
};
