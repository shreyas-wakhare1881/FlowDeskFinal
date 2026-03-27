export interface TeamLead {
  leadId: string;
  name: string;
  avatar: string;
  avatarColor: string;
}

export interface TeamMember {
  memberId: string;
  name: string;
  avatar: string;
  avatarColor: string;
  role: string;
  status?: string;
}

export interface Metrics {
  completionPercentage: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksOverdue: number;
}

export interface Project {
  id: string;
  projectID: string;
  projectName: string;
  projectDescription?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'overdue';
  statusLabel: string;
  priority: 'critical' | 'medium' | 'low';
  category: string;
  createdDate: string;
  assignedDate: string;
  dueDate: string;
  completedDate?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  teamID: string;
  teamName: string;
  assigneeID: string;
  assigneeName: string;
  assigneeAvatar: string;
  assigneeAvatarColor: string;
  teamLead?: TeamLead;
  teamMembers?: TeamMember[];
  metrics?: Metrics;
  tags?: { id: string; tag: string; projectId: string }[];
  teams?: {
    id: string;
    teamID: string;
    teamName: string;
    projectId: string;
    createdAt: string;
    members: { id: string; name: string; avatar: string; color: string; teamId: string }[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  projectName: string;
  projectDescription?: string;
  status: string;
  statusLabel: string;
  priority: string;
  category: string;
  assignedDate: Date | string;
  dueDate: Date | string;
  teamID: string;
  teamName: string;
  assigneeID: string;
  assigneeName: string;
  assigneeAvatar: string;
  assigneeAvatarColor: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringFrequency?: string;
  teamLead?: {
    leadId: string;
    name: string;
    avatar: string;
    avatarColor: string;
  };
  teamMembers?: Array<{
    memberId: string;
    name: string;
    avatar: string;
    avatarColor: string;
    role: string;
    status?: string;
  }>;
  metrics?: {
    completionPercentage?: number;
    tasksTotal?: number;
    tasksCompleted?: number;
    tasksInProgress?: number;
    tasksOverdue?: number;
  };
}

export interface UpdateProjectDto {
  projectName?: string;
  projectDescription?: string;
  status?: string;
  statusLabel?: string;
  priority?: string;
  category?: string;
  dueDate?: Date | string;
  completedDate?: Date | string;
  teamName?: string;
  metrics?: {
    completionPercentage?: number;
    tasksTotal?: number;
    tasksCompleted?: number;
    tasksInProgress?: number;
    tasksOverdue?: number;
  };
}

export interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}
