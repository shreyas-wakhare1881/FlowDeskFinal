import { api } from './api';

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
  color: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  _count: { issues: number };
}

export interface ReorderItem {
  id: string;
  position: number;
}

export const boardColumnsService = {
  /**
   * GET /board-columns?projectId=<id>
   * Returns all columns for a project sorted by position.
   * Auto-seeds default columns on first call if none exist.
   */
  getAll: (projectId: string): Promise<BoardColumn[]> =>
    api.get<BoardColumn[]>(`/board-columns?projectId=${encodeURIComponent(projectId)}`),

  /**
   * POST /board-columns
   * Creates a new column at the end of the board.
   */
  create: (projectId: string, name: string, color?: string): Promise<BoardColumn> =>
    api.post<BoardColumn>('/board-columns', { projectId, name, color }),

  /**
   * PATCH /board-columns/:id
   * Renames or recolors a column.
   */
  update: (id: string, projectId: string, data: { name?: string; color?: string }): Promise<BoardColumn> =>
    api.patch<BoardColumn>(`/board-columns/${id}`, { ...data, projectId }),

  /**
   * PATCH /board-columns/reorder
   * Bulk-updates column positions.
   */
  reorder: (projectId: string, columns: ReorderItem[]): Promise<BoardColumn[]> =>
    api.patch<BoardColumn[]>('/board-columns/reorder', { projectId, columns }),

  /**
   * DELETE /board-columns/:id
   * Deletes a column. Optionally moves issues to another column.
   */
  delete: (
    id: string,
    projectId: string,
    moveToColumnId?: string,
  ): Promise<void> =>
    api.delete<void>(`/board-columns/${id}`, {
      params: { projectId },
      body: {
        projectId,
        ...(moveToColumnId ? { moveToColumnId } : {}),
      },
    }),
};
