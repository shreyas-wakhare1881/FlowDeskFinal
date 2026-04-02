// ── Enums (mirror backend Prisma enums) ──────────────────────────────────────

export type IssueType = 'EPIC' | 'STORY' | 'TASK' | 'BUG';

export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type IssueLinkType = 'BLOCKS' | 'DEPENDS_ON' | 'RELATES_TO' | 'DUPLICATES';

// ── User sub-shape embedded in issues ────────────────────────────────────────

export interface IssueUser {
  id: string;
  name: string;
  email: string;
}

// ── Flat issue (singular row, no nested children) ─────────────────────────────

export interface Issue {
  id: string;
  issueKey: string;
  type: IssueType;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  /** EPIC-specific: true when Epic is manually marked done via ✔ button */
  isCompleted: boolean;
  parentId: string | null;
  projectId: string;
  assigneeId: string | null;
  reporterId: string | null;
  assignee: IssueUser | null;
  reporter: IssueUser | null;
  createdAt: string;
  updatedAt: string;
}

// ── Issue link ────────────────────────────────────────────────────────────────

export interface IssueLink {
  id: string;
  linkType: IssueLinkType;
  source?: Issue;
  target?: Issue;
}

// ── Full detail shape returned from GET /issues/:id ──────────────────────────

export interface IssueDetail extends Issue {
  parent: Issue | null;
  children: Issue[];
  sourceLinks: (IssueLink & { target: Issue })[];
  targetLinks: (IssueLink & { source: Issue })[];
}

// ── Nested tree shapes ────────────────────────────────────────────────────────
// Tree nodes now carry a generic children array so any type can be root

export interface IssueWithChildren extends Issue {
  children: IssueWithChildren[];
}

// Keep typed aliases for backwards compatibility in BacklogView
export interface IssueTask extends Issue {
  type: 'TASK' | 'BUG';
  children: never[];
}

export interface IssueStory extends Issue {
  type: 'STORY';
  children: IssueTask[];
}

export interface IssueEpic extends Issue {
  type: 'EPIC';
  children: IssueStory[];
}

/** Root-level tree node returned from GET /issues/tree
 * Can be any type (EPIC, or orphan STORY/TASK/BUG) */
export type IssueTree = IssueWithChildren;

// ── API request DTOs ─────────────────────────────────────────────────────────

export interface CreateIssuePayload {
  projectId: string;
  type: IssueType;
  title: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  parentId?: string;
  assigneeId?: string;
  reporterId?: string;
}

export interface UpdateIssuePayload {
  projectId: string;
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  parentId?: string | null;
  assigneeId?: string | null;
}

export interface CreateIssueLinkPayload {
  projectId: string;
  sourceIssueId: string;
  targetIssueId: string;
  linkType: IssueLinkType;
}

// ── Project member (used for assignee dropdown) ───────────────────────────────

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarInitials?: string;
  avatarColor?: string;
}

// ── Team Progress ─────────────────────────────────────────────────────────────

/** Shape returned by GET /projects/:id/progress */
export interface TeamProgressEntry {
  userId: string;
  name: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
}
