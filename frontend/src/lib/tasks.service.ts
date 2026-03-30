import { api } from './api';
import type { Task, CreateTaskDto, UpdateTaskDto, TaskStats } from '@/types/task';

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const BASE = '/tasks';

export const tasksService = {
  /** GET /api/tasks?projectId=<id> — returns full array (backward compat) */
  getAll(projectId?: string): Promise<Task[]> {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return api.get<PaginatedResponse<Task>>(`${BASE}${query}`).then(res => res.data);
  },

  /** GET /api/tasks?projectId=<id>&page=1&limit=10 — returns paginated */
  getPaginated(projectId?: string, page = 1, limit = 10): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (projectId) params.set('projectId', projectId);
    return api.get<PaginatedResponse<Task>>(`${BASE}?${params.toString()}`);
  },

  /** GET /api/tasks/:id */
  getById(id: string): Promise<Task> {
    return api.get<Task>(`${BASE}/${id}`);
  },

  /** GET /api/tasks/task-id/:taskID */
  getByTaskID(taskID: string): Promise<Task> {
    return api.get<Task>(`${BASE}/task-id/${taskID}`);
  },

  /** GET /api/tasks/stats/:projectId */
  getStats(projectId: string): Promise<TaskStats> {
    return api.get<TaskStats>(`${BASE}/stats/${encodeURIComponent(projectId)}`);
  },

  /** POST /api/tasks */
  create(dto: CreateTaskDto): Promise<Task> {
    return api.post<Task>(BASE, dto);
  },

  /** PUT /api/tasks/:id */
  update(id: string, dto: UpdateTaskDto): Promise<Task> {
    return api.put<Task>(`${BASE}/${id}`, dto);
  },

  /**
   * DELETE /api/tasks/:id?projectId=<uuid>
   * projectId is required — PermissionGuard resolves it from the query string
   * since DELETE requests do not carry a body.
   */
  delete(id: string, projectId: string): Promise<{ message: string }> {
    return api.delete<{ message: string }>(`${BASE}/${id}`, { projectId });
  },
};
