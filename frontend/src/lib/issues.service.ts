import { api } from './api';
import type {
  Issue,
  IssueDetail,
  IssueTree,
  IssueType,
  IssueLink,
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

  /** Get nested tree for a project — root items have parentId===null (any type) */
  getTree: (projectId: string): Promise<IssueTree[]> =>
    api.get<IssueTree[]>(`/issues/tree?projectId=${encodeURIComponent(projectId)}`),

  /** Get a single issue with full detail (parent, children, sourceLinks, targetLinks) */
  getOne: (id: string, projectId: string): Promise<IssueDetail> =>
    api.get<IssueDetail>(`/issues/${id}?projectId=${encodeURIComponent(projectId)}`),

  /** Update an issue (partial patch) */
  update: (id: string, data: UpdateIssuePayload): Promise<IssueDetail> =>
    api.patch<IssueDetail>(`/issues/${id}`, data),

  /** Delete an issue — projectId sent as query param for PermissionGuard */
  delete: (id: string, projectId: string): Promise<{ deleted: boolean; id: string }> =>
    api.delete<{ deleted: boolean; id: string }>(`/issues/${id}`, { projectId }),

  /** Link two issues (BLOCKS, DEPENDS_ON, RELATES_TO, DUPLICATES) */
  addLink: (data: CreateIssueLinkPayload): Promise<IssueLink> =>
    api.post<IssueLink>('/issue-links', data),

  /** Remove an issue link by its ID */
  deleteLink: (linkId: string, projectId: string): Promise<{ deleted: boolean; id: string }> =>
    api.delete<{ deleted: boolean; id: string }>(`/issue-links/${linkId}?projectId=${encodeURIComponent(projectId)}`),
};
