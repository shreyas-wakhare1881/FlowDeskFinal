import { api } from './api';
import type {
  Issue,
  IssueComment,
  IssueDetail,
  IssueTree,
  IssueType,
  IssueLink,
  CreateIssueCommentPayload,
  CreateIssuePayload,
  UpdateIssuePayload,
  CreateIssueLinkPayload,
} from '@/types/issue';

export const issuesService = {
  /** Create a new issue (EPIC / STORY / TASK / BUG) */
  create: (data: CreateIssuePayload): Promise<Issue> =>
    api.post<Issue>('/issues', data),

  /** Get all issues for a project, optionally filtered by type, assigneeId, or search query */
  getAll: (projectId: string, type?: IssueType, assigneeId?: string, q?: string): Promise<Issue[]> => {
    const params = new URLSearchParams({ projectId });
    if (type) params.set('type', type);
    if (assigneeId) params.set('assigneeId', assigneeId);
    if (q) params.set('q', q);
    return api.get<Issue[]>(`/issues?${params.toString()}`);
  },

  /**
   * Get only Task / Bug / Story issues (no EPICs) — for the Kanban board.
   * Supports filter: 'recently_updated' | 'assigned_to_me'
   */
  getKanban: (projectId: string, filter?: string): Promise<Issue[]> => {
    const params = new URLSearchParams({ projectId });
    if (filter) params.set('filter', filter);
    return api.get<Issue[]>(`/issues/kanban?${params.toString()}`);
  },

  /** Get nested tree for a project — root items have parentId===null (any type) */
  getTree: (projectId: string): Promise<IssueTree[]> =>
    api.get<IssueTree[]>(`/issues/tree?projectId=${encodeURIComponent(projectId)}`),

  /** Unified search across all issue types — matches issueKey or title */
  search: (projectId: string, q: string): Promise<Issue[]> =>
    api.get<Issue[]>(`/issues/search?q=${encodeURIComponent(q)}&projectId=${encodeURIComponent(projectId)}`),

  /** Get a single issue with full detail (parent, children, sourceLinks, targetLinks) */
  getOne: (id: string, projectId: string): Promise<IssueDetail> =>
    api.get<IssueDetail>(`/issues/${id}?projectId=${encodeURIComponent(projectId)}`),

  /** Update an issue (partial patch) */
  update: (id: string, data: UpdateIssuePayload): Promise<IssueDetail> =>
    api.patch<IssueDetail>(`/issues/${id}`, data),

  /**
   * Mark an EPIC as completed (or un-complete it).
   * PATCH /issues/:id/complete  Body: { isCompleted: boolean, projectId: string }
   */
  completeEpic: (id: string, projectId: string, isCompleted: boolean): Promise<Issue> =>
    api.patch<Issue>(`/issues/${id}/complete`, { isCompleted, projectId }),

  /** Delete an issue — projectId sent as query param for PermissionGuard */
  delete: (id: string, projectId: string): Promise<{ deleted: boolean; id: string }> =>
    api.delete<{ deleted: boolean; id: string }>(`/issues/${id}`, { projectId }),

  /** Get comments for an issue */
  getComments: (id: string, projectId: string): Promise<IssueComment[]> =>
    api.get<IssueComment[]>(`/issues/${id}/comments?projectId=${encodeURIComponent(projectId)}`),

  /** Add a comment to an issue */
  addComment: (id: string, data: CreateIssueCommentPayload): Promise<IssueComment> =>
    api.post<IssueComment>(`/issues/${id}/comments`, data),

  /** Link two issues (BLOCKS, DEPENDS_ON, RELATES_TO, DUPLICATES) */
  addLink: (data: CreateIssueLinkPayload): Promise<IssueLink> =>
    api.post<IssueLink>('/issue-links', data),

  /** Remove an issue link by its ID */
  deleteLink: (linkId: string, projectId: string): Promise<{ deleted: boolean; id: string }> =>
    api.delete<{ deleted: boolean; id: string }>(`/issue-links/${linkId}?projectId=${encodeURIComponent(projectId)}`),
};
