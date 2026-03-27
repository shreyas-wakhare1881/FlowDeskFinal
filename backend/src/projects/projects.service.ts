import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

// Shared include object used across all queries
const FULL_INCLUDE = {
  teamLead: true,
  teamMembers: true,
  metrics: true,
  tags: true,
  teams: { include: { members: true } },
} as const;

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    // Generate unique project ID
    const projectCount = await this.prisma.project.count();
    const projectNumber = String(projectCount + 1).padStart(3, '0');
    const projectID = `PRJ-${projectNumber}`;

    // Create project with nested relations
    const project = await this.prisma.project.create({
      data: {
        projectID,
        projectName: createProjectDto.projectName,
        projectDescription: createProjectDto.projectDescription,
        status: createProjectDto.status,
        statusLabel: createProjectDto.statusLabel,
        priority: createProjectDto.priority,
        category: createProjectDto.category,
        assignedDate: new Date(createProjectDto.assignedDate),
        dueDate: new Date(createProjectDto.dueDate),
        teamID: createProjectDto.teamID ?? '',
        teamName: createProjectDto.teamName ?? 'Unassigned',
        assigneeID: createProjectDto.assigneeID ?? '',
        assigneeName: createProjectDto.assigneeName ?? 'Unassigned',
        assigneeAvatar: createProjectDto.assigneeAvatar ?? '',
        assigneeAvatarColor: createProjectDto.assigneeAvatarColor ?? '#4361ee',
        isRecurring: createProjectDto.isRecurring || false,
        recurringFrequency: createProjectDto.recurringFrequency,
        tags: createProjectDto.tags?.length
          ? { create: createProjectDto.tags.map((tag) => ({ tag })) }
          : undefined,
        teamLead: createProjectDto.teamLead
          ? {
              create: {
                leadId: createProjectDto.teamLead.leadId,
                name: createProjectDto.teamLead.name,
                avatar: createProjectDto.teamLead.avatar,
                avatarColor: createProjectDto.teamLead.avatarColor,
              },
            }
          : undefined,
        teamMembers: createProjectDto.teamMembers
          ? {
              create: createProjectDto.teamMembers.map((member) => ({
                memberId: member.memberId,
                name: member.name,
                avatar: member.avatar,
                avatarColor: member.avatarColor,
                role: member.role,
                status: member.status || 'online',
              })),
            }
          : undefined,
        metrics: createProjectDto.metrics
          ? {
              create: {
                completionPercentage: createProjectDto.metrics.completionPercentage || 0,
                tasksTotal: createProjectDto.metrics.tasksTotal || 0,
                tasksCompleted: createProjectDto.metrics.tasksCompleted || 0,
                tasksInProgress: createProjectDto.metrics.tasksInProgress || 0,
                tasksOverdue: createProjectDto.metrics.tasksOverdue || 0,
              },
            }
          : undefined,
      },
      include: FULL_INCLUDE,
    });

    return project;
  }

  async findAll({ page = 1, limit = 1000 }: { page?: number; limit?: number } = {}) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        skip,
        take: limit,
        include: FULL_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count(),
    ]);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: FULL_INCLUDE,
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async findByProjectID(projectID: string) {
    const project = await this.prisma.project.findUnique({
      where: { projectID },
      include: FULL_INCLUDE,
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectID} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // Check if project exists
    await this.findOne(id);

    const updateData: any = { ...updateProjectDto };

    // Handle metrics update separately
    if (updateProjectDto.metrics) {
      delete updateData.metrics;
      await this.prisma.metrics.upsert({
        where: { projectId: id },
        update: updateProjectDto.metrics,
        create: { ...updateProjectDto.metrics, projectId: id },
      });
    }

    // Handle tags update — replace all tags
    if (updateProjectDto.tags !== undefined) {
      delete updateData.tags;
      await this.prisma.projectTag.deleteMany({ where: { projectId: id } });
      if (updateProjectDto.tags.length > 0) {
        await this.prisma.projectTag.createMany({
          data: updateProjectDto.tags.map((tag) => ({ tag, projectId: id })),
        });
      }
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: updateData,
      include: FULL_INCLUDE,
    });

    return project;
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async getStats() {
    const total = await this.prisma.project.count();
    const completed = await this.prisma.project.count({
      where: { status: 'completed' },
    });
    const inProgress = await this.prisma.project.count({
      where: { status: 'in-progress' },
    });
    const overdue = await this.prisma.project.count({
      where: { status: 'overdue' },
    });

    return {
      total,
      completed,
      inProgress,
      overdue,
    };
  }
}
