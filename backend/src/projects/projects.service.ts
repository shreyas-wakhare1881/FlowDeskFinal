import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

// Shared include object used across all queries
const FULL_INCLUDE = {
  teamLead: true,
  teamMembers: true,
  metrics: true,
  tags: true,
  teams: { include: { members: true } },
  // Real RBAC members with user info (for live avatars on project cards)
  userRoles: {
    include: {
      user: { select: { id: true, name: true, email: true } },
      role: { select: { id: true, name: true } },
    },
    orderBy: { assignedAt: 'asc' as const },
  },
  // Real issue count
  _count: { select: { issues: true } },
} as const;

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new project.
   * If createdById is provided (Phase 2+), the creator is automatically
   * assigned the Manager role in user_roles for this project.
   */
  async create(createProjectDto: CreateProjectDto, createdById?: string) {
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
        // Phase 2: set project ownership
        ...(createdById ? { createdById } : {}),
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

    // Phase 2: auto-assign creator to user_roles.
    // SuperAdmin stays SuperAdmin — they must never be downgraded to Manager.
    // Any other user (e.g. future non-SuperAdmin project creator) gets Manager.
    if (createdById) {
      const isSuperAdmin = await this.prisma.userRole.findFirst({
        where: { userId: createdById, role: { name: 'SuperAdmin' } },
        include: { role: true },
      });

      const roleName = isSuperAdmin ? 'SuperAdmin' : 'Manager';
      const assignedRole = await this.prisma.role.findUnique({ where: { name: roleName } });

      if (assignedRole) {
        await this.prisma.userRole.create({
          data: {
            userId: createdById,
            roleId: assignedRole.id,
            projectId: project.id,
          },
        });
      }
    }

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

  async remove(id: string, requestingUserId: string) {
    const project = await this.findOne(id);

    // SuperAdmin can delete any project.
    // Manager can only delete projects they created (project.createdById === them).
    const isSuperAdmin = await this.prisma.userRole.findFirst({
      where: { userId: requestingUserId, role: { name: 'SuperAdmin' } },
    });

    if (!isSuperAdmin && project.createdById !== requestingUserId) {
      throw new ForbiddenException('Managers can only delete projects they created');
    }

    return this.prisma.project.delete({
      where: { id },
    });
  }

  /**
   * GET /projects/roles
   * Returns roles that can be assigned by Manager or SuperAdmin.
   * SuperAdmin role is excluded — only SuperAdmin can assign SuperAdmin (enforced in addMember).
   */
  async getAssignableRoles() {
    return this.prisma.role.findMany({
      where: { name: { in: ['Manager', 'Developer', 'Client'] } },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
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

  // ── RBAC Methods (Phase 2) ───────────────────────────────────────────────

  /**
   * GET /projects/my
   * Returns projects where the user has an RBAC role assignment OR created the project.
   * Rule: Manager sees assigned projects + projects created by themselves.
   */
  async findMyProjects(userId: string) {
    // 1. Projects via RBAC assignment (user_roles table)
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const roleProjectIds = userRoles.map((ur) => ur.projectId);

    // 2. Projects created by this user (fallback: auto-assign inserts into user_roles on
    //    create, but this covers edge cases where that row may not exist yet)
    const createdProjects = await this.prisma.project.findMany({
      where: { createdById: userId },
      select: { id: true },
    });
    const createdProjectIds = createdProjects.map((p) => p.id);

    // Union — deduplicated
    const allIds = [...new Set([...roleProjectIds, ...createdProjectIds])];
    if (allIds.length === 0) return { data: [], meta: { total: 0 } };

    const projectsRaw = await this.prisma.project.findMany({
      where: { id: { in: allIds } },
      include: FULL_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    // Map projects to include the specific role of the requesting user
    const data = await Promise.all(
      projectsRaw.map(async (project) => {
        const userRole = await this.prisma.userRole.findFirst({
          where: { userId, projectId: project.id },
          include: { role: true },
        });
        return {
          ...project,
          userRole: userRole?.role?.name || 'DEVELOPER', // fallback to DEVELOPER if unknown
        };
      }),
    );

    return { data, meta: { total: data.length } };
  }

  /**
   * GET /projects/:id/permissions
   * Returns the current user's role name + flat permission list for a project.
   */
  async getMyPermissions(projectIdOrCode: string, userId: string) {
    // Resolve — accept both UUID and short code (e.g. PRJ-009)
    const resolvedProject = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectIdOrCode }, { projectID: projectIdOrCode }] },
      select: { id: true },
    });
    const projectId = resolvedProject?.id ?? projectIdOrCode;

    const userRole = await this.prisma.userRole.findFirst({
      where: { userId, projectId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!userRole) {
      // User is not a member — return empty with no role
      return { projectId, role: null, permissions: [] };
    }

    // SuperAdmin and Manager bypass — mirrors PermissionGuard backend logic.
    // SuperAdmin/Manager's DB role_permissions only list MANAGE_* entries, but they
    // bypass ALL permission checks on the backend. Return every permission so
    // the frontend doesn't incorrectly block access on granular checks.
    if (userRole.role.name === 'SuperAdmin' || userRole.role.name === 'Manager') {
      const allPermissions = await this.prisma.permission.findMany({
        select: { name: true },
      });
      return {
        projectId,
        role: userRole.role.name,
        permissions: allPermissions.map((p) => p.name),
      };
    }

    const permissions = userRole.role.rolePermissions.map(
      (rp) => rp.permission.name,
    );

    return {
      projectId,
      role: userRole.role.name,
      permissions,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private helper: accepts UUID **or** short code (e.g. PRJ-001).
  // Returns the real UUID — throws NotFoundException if not found.
  // ─────────────────────────────────────────────────────────────────────────
  private async resolveProjectId(projectIdOrCode: string): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectIdOrCode }, { projectID: projectIdOrCode }] },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException(`Project '${projectIdOrCode}' not found`);
    }
    return project.id;
  }

  /**
   * GET /projects/:id/members
   * Lists all members of a project with their assigned roles.
   * Accepts both UUID and short project code (e.g. PRJ-001).
   */
  async getMembers(projectIdOrCode: string) {
    const projectId = await this.resolveProjectId(projectIdOrCode);

    const members = await this.prisma.userRole.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        role: { select: { id: true, name: true } },
      },
    });

    return members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      roleId: m.role.id,
      roleName: m.role.name,
      assignedAt: m.assignedAt,
    }));
  }

  /**
   * POST /projects/:id/members
   * Adds a user to a project with the given role.
   * Accepts both UUID and short project code (e.g. PRJ-001).
   */
  async addMember(
    projectIdOrCode: string,
    targetUserId: string,
    roleId: string,
    assignedById: string,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrCode);

    const userExists = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!userExists) throw new NotFoundException(`User ${targetUserId} not found`);

    const roleExists = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!roleExists) throw new NotFoundException(`Role ${roleId} not found`);

    // Security: only SuperAdmin can assign the SuperAdmin role.
    // A Manager calling this endpoint must not be able to escalate any user.
    if (roleExists.name === 'SuperAdmin') {
      const callerRole = await this.prisma.userRole.findFirst({
        where: { userId: assignedById, role: { name: 'SuperAdmin' } },
        include: { role: true },
      });
      if (!callerRole) {
        throw new ForbiddenException('Only SuperAdmin can assign the SuperAdmin role');
      }
    }

    // Check for duplicate — one role per user per project
    const existing = await this.prisma.userRole.findFirst({
      where: { userId: targetUserId, projectId },
    });
    if (existing) {
      throw new ConflictException('User already has a role in this project');
    }

    return this.prisma.userRole.create({
      data: { userId: targetUserId, roleId, projectId, assignedById },
      include: {
        user: { select: { id: true, name: true, email: true } },
        role: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * DELETE /projects/:id/members/:userId
   * Removes a user's role assignment from a project.
   * Accepts both UUID and short project code.
   */
  async removeMember(projectIdOrCode: string, targetUserId: string) {
    const projectId = await this.resolveProjectId(projectIdOrCode);
    const existing = await this.prisma.userRole.findFirst({
      where: { userId: targetUserId, projectId },
    });
    if (!existing) {
      throw new NotFoundException('User is not a member of this project');
    }

    await this.prisma.userRole.deleteMany({
      where: { userId: targetUserId, projectId },
    });

    return { message: 'Member removed successfully' };
  }

  /**
   * POST /projects/:id/assign-manager
   * SuperAdmin assigns an existing user as Manager in a project.
   * Internally calls addMember with the Manager role — no need to look up roleId on frontend.
   */
  async assignManager(projectId: string, targetUserId: string, assignedById: string) {
    const managerRole = await this.prisma.role.findUnique({ where: { name: 'Manager' } });
    if (!managerRole) {
      throw new NotFoundException('Manager role not found in database');
    }
    return this.addMember(projectId, targetUserId, managerRole.id, assignedById);
  }

  /**
   * PUT /projects/:id/members/:userId
   * Changes an existing member's role in a project.
   * roleId is part of the composite PK (userId, roleId, projectId), so we
   * cannot UPDATE it in place — must delete + recreate atomically.
   */
  async updateMemberRole(
    projectIdOrCode: string,
    targetUserId: string,
    newRoleId: string,
    assignedById: string,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrCode);

    const existing = await this.prisma.userRole.findFirst({
      where: { userId: targetUserId, projectId },
    });
    if (!existing) throw new NotFoundException('User is not a member of this project');

    const roleExists = await this.prisma.role.findUnique({ where: { id: newRoleId } });
    if (!roleExists) throw new NotFoundException(`Role ${newRoleId} not found`);

    // Security: only SuperAdmin can assign the SuperAdmin role
    if (roleExists.name === 'SuperAdmin') {
      const callerIsSuperAdmin = await this.prisma.userRole.findFirst({
        where: { userId: assignedById, role: { name: 'SuperAdmin' } },
      });
      if (!callerIsSuperAdmin) {
        throw new ForbiddenException('Only SuperAdmin can assign the SuperAdmin role');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: targetUserId, projectId } });
      return tx.userRole.create({
        data: { userId: targetUserId, roleId: newRoleId, projectId, assignedById },
        include: {
          user: { select: { id: true, name: true, email: true } },
          role: { select: { id: true, name: true } },
        },
      });
    });

    return {
      userId: updated.userId,
      name: updated.user.name,
      email: updated.user.email,
      roleId: updated.role.id,
      roleName: updated.role.name,
      assignedAt: updated.assignedAt,
    };
  }
}
