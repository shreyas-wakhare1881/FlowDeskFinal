// ============================================
// WORKSPACE VIEW — Task types
// ============================================

export interface TaskAssignee {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  taskId: string;
}

export interface Task {
  id: string;
  taskID: string;          // TASK-101
  taskName: string;
  taskDescription?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'overdue';
  statusLabel: string;
  priority: 'critical' | 'medium' | 'low';
  isRecurring: boolean;
  recurringFrequency?: string;
  createdAt: string;
  dueDate: string;
  completedDate?: string;
  projectId: string;
  assignees: TaskAssignee[];
  progress: number;
}

export interface CreateTaskDto {
  taskName: string;
  taskDescription?: string;
  status?: string;
  priority: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  dueDate: string;
  projectId: string;
  assigneeNames?: string[];
}

export interface UpdateTaskDto {
  taskName?: string;
  taskDescription?: string;
  status?: string;
  priority?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  dueDate?: string;
  assigneeNames?: string[];
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  completed: number;
  overdue: number;
}
