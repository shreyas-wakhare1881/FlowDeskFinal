import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';

const AVATAR_MAP: Record<string, { avatar: string; color: string }> = {
  'Rahul Kumar':   { avatar: 'RK', color: '#4361ee' },
  'Sneha Patel':   { avatar: 'SP', color: '#06d6a0' },
  'Vishal Tiwari': { avatar: 'VT', color: '#3a86ff' },
  'Arjun Mehta':   { avatar: 'AM', color: '#7209b7' },
  'Priya Das':     { avatar: 'PD', color: '#f9a825' },
};

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskDto) {
    const count = await this.prisma.task.count();
    const taskID = `TASK-${String(count + 101).padStart(3, '0')}`;

    const task = await this.prisma.task.create({
      data: {
        taskID,
        taskName: dto.taskName,
        taskDescription: dto.taskDescription,
        status: dto.status || 'todo',
        priority: dto.priority,
        isRecurring: dto.isRecurring || false,
        recurringFrequency: dto.recurringFrequency,
        dueDate: new Date(dto.dueDate),
        projectId: dto.projectId,
        assignees: dto.assigneeNames?.length
          ? {
              create: dto.assigneeNames.map((name) => ({
                name,
                avatar: AVATAR_MAP[name]?.avatar || name.slice(0, 2).toUpperCase(),
                avatarColor: AVATAR_MAP[name]?.color || '#4361ee',
              })),
            }
          : undefined,
      },
      include: { assignees: true },
    });

    return this.formatTask(task);
  }

  async findAll(projectId?: string, { page = 1, limit = 1000 }: { page?: number; limit?: number } = {}) {
    const skip = (page - 1) * limit;
    const where = projectId ? { projectId } : undefined;
    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: { assignees: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);
    return {
      data: tasks.map((t) => this.formatTask(t)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { assignees: true },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return this.formatTask(task);
  }

  async findByTaskID(taskID: string) {
    const task = await this.prisma.task.findUnique({
      where: { taskID },
      include: { assignees: true },
    });
    if (!task) throw new NotFoundException(`Task ${taskID} not found`);
    return this.formatTask(task);
  }

  async update(id: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Task ${id} not found`);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        taskName: dto.taskName,
        taskDescription: dto.taskDescription,
        status: dto.status,
        priority: dto.priority,
        isRecurring: dto.isRecurring,
        recurringFrequency: dto.recurringFrequency,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedDate: dto.status === 'completed' ? new Date() : undefined,
        assignees: dto.assigneeNames
          ? {
              deleteMany: {},
              create: dto.assigneeNames.map((name) => ({
                name,
                avatar: AVATAR_MAP[name]?.avatar || name.slice(0, 2).toUpperCase(),
                avatarColor: AVATAR_MAP[name]?.color || '#4361ee',
              })),
            }
          : undefined,
      },
      include: { assignees: true },
    });

    return this.formatTask(task);
  }

  async remove(id: string) {
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Task ${id} not found`);
    await this.prisma.task.delete({ where: { id } });
    return { message: `Task ${id} deleted successfully` };
  }

  async getStats(projectId: string) {
    const tasks = await this.prisma.task.findMany({ where: { projectId } });
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      overdue: tasks.filter((t) => t.status === 'overdue').length,
    };
  }

  private formatTask(task: any) {
    return {
      id: task.id,
      taskID: task.taskID,
      taskName: task.taskName,
      taskDescription: task.taskDescription,
      status: task.status,
      statusLabel: this.getStatusLabel(task.status),
      priority: task.priority,
      isRecurring: task.isRecurring,
      recurringFrequency: task.recurringFrequency,
      createdAt: task.createdAt,
      dueDate: task.dueDate,
      completedDate: task.completedDate,
      projectId: task.projectId,
      assignees: task.assignees || [],
      progress: this.getProgress(task.status),
    };
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      todo: 'To Do',
      'in-progress': 'In Progress',
      completed: 'Completed',
      overdue: 'Overdue',
    };
    return labels[status] || status;
  }

  private getProgress(status: string): number {
    const prog: Record<string, number> = {
      todo: 0, 'in-progress': 50, completed: 100, overdue: 25,
    };
    return prog[status] ?? 0;
  }
}
