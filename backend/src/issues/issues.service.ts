import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IssueType, IssuePriority, IssueStatus } from '@prisma/client';
import { CreateIssueDto, UpdateIssueDto } from './issues.dto';

// ── Prisma select shape for a flat issue (no links, no children) ─────────────
const ISSUE_SELECT = {
  id: true,
  issueKey: true,
  type: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  isCompleted: true,
  parentId: true,
  projectId: true,
  assigneeId: true,
  reporterId: true,
  estimate: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: { id: true, name: true, email: true } },
  reporter: { select: { id: true, name: true, email: true } },
} as const;

// ── Full detail select (used by findOne) ─────────────────────────────────────
const ISSUE_DETAIL_SELECT = {
  ...ISSUE_SELECT,
  // immediate parent
  parent: { select: ISSUE_SELECT },
  // direct children (one level)
  children: {
    select: ISSUE_SELECT,
    orderBy: { createdAt: 'asc' as const },
  },
  // links where this issue is the source
  sourceLinks: {
    select: {
      id: true,
      linkType: true,
      target: { select: ISSUE_SELECT },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  // links where this issue is the target
  targetLinks: {
    select: {
      id: true,
      linkType: true,
      source: { select: ISSUE_SELECT },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Generates the next scoped issue key for a project.
   * Counts all issues in the project and returns `<projectShortCode>-<n+1>`.
   * Uses projectID (e.g. "PRJ-001") as the prefix.
   */
  private async generateIssueKey(projectId: string): Promise<string> {
    // Resolve to real UUID if short code was passed
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectId }, { projectID: projectId }] },
      select: { id: true, projectID: true },
    });
    if (!project) throw new NotFoundException(`Project not found: ${projectId}`);

    const count = await this.prisma.issue.count({
      where: { projectId: project.id },
    });
    // Use the short project code prefix (e.g. PRJ-001 → "PRJ-001-1")
    return `${project.projectID}-${count + 1}`;
  }

  /**
   * Validates parent-child hierarchy rules when parentId is provided.
   * Parent is ALWAYS optional — this only validates type compatibility when a parent is given.
   *
   * Rules (when parentId is provided):
   * - EPIC  → cannot have any parent
   * - STORY → parent must be EPIC
   * - TASK  → parent must be STORY or EPIC
   * - BUG   → parent must be STORY or EPIC
   */
  private async validateHierarchy(
    type: IssueType,
    parentId: string | undefined | null,
  ): Promise<void> {
    // EPIC can never have a parent
    if (type === IssueType.EPIC && parentId) {
      throw new BadRequestException('EPIC cannot have a parent issue');
    }

    // All other types: parent is optional — skip validation if not provided
    if (!parentId) return;

    const parent = await this.prisma.issue.findUnique({
      where: { id: parentId },
      select: { type: true },
    });

    if (!parent) {
      throw new BadRequestException(`Parent issue not found: ${parentId}`);
    }

    if (type === IssueType.STORY && parent.type !== IssueType.EPIC) {
      throw new BadRequestException('STORY parent must be an EPIC');
    }

    if (
      (type === IssueType.TASK || type === IssueType.BUG) &&
      parent.type !== IssueType.STORY &&
      parent.type !== IssueType.EPIC
    ) {
      throw new BadRequestException('TASK/BUG parent must be a STORY or EPIC');
    }
  }

  /**
   * Prevents circular parent references.
   * Walk UP from candidate parentId — if we reach issueId, it's a cycle.
   */
  private async detectCircularParent(issueId: string, proposedParentId: string): Promise<void> {
    let currentId: string | null = proposedParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (visited.has(currentId)) break; // safety against infinite DB loop
      visited.add(currentId);

      if (currentId === issueId) {
        throw new BadRequestException('Circular parent reference detected');
      }

      const ancestor = await this.prisma.issue.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });
      currentId = ancestor?.parentId ?? null;
    }
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateIssueDto) {
    // Resolve project UUID (outside transaction — read-only, safe)
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: dto.projectId }, { projectID: dto.projectId }] },
      select: { id: true, projectID: true },
    });
    if (!project) throw new NotFoundException(`Project not found: ${dto.projectId}`);

    await this.validateHierarchy(dto.type, dto.parentId);

    // ── EPIC container rules ──────────────────────────────────────────────────
    if (dto.type === IssueType.EPIC) {
      dto.assigneeId = undefined;
      dto.status = undefined;
    }

    // Validate assignee belongs to the project
    if (dto.assigneeId) {
      const membership = await this.prisma.userRole.findFirst({
        where: { userId: dto.assigneeId, projectId: project.id },
      });
      if (!membership) {
        throw new BadRequestException('Assignee must be a member of this project');
      }
    }

    // ── Atomic: key generation + insert in a single serializable transaction ──
    // Prevents race condition where two concurrent creates receive the same count
    // and collide on the issueKey UNIQUE constraint.
    return this.prisma.$transaction(
      async (tx) => {
        const count = await tx.issue.count({ where: { projectId: project.id } });
        const issueKey = `${project.projectID}-${count + 1}`;

        return tx.issue.create({
          data: {
            issueKey,
            type: dto.type,
            title: dto.title,
            description: dto.description,
            status: dto.status ?? IssueStatus.TODO,
            priority: dto.priority ?? IssuePriority.MEDIUM,
            parentId: dto.parentId ?? null,
            projectId: project.id,
            assigneeId: dto.assigneeId ?? null,
            reporterId: dto.reporterId ?? null,
            estimate: dto.estimate
              ? isNaN(Number(dto.estimate)) ? dto.estimate : `${dto.estimate}h`
              : null,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          },
          select: ISSUE_SELECT,
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * GET /issues/search?q=<query>&projectId=<id>
   * Multi-type search: matches issueKey OR title across all types.
   * Results ordered by type priority (EPIC, STORY, TASK, BUG).
   */
  async search(q: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectId }, { projectID: projectId }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project not found: ${projectId}`);

    // Also search projects by name/projectID if query might be a project reference
    return this.prisma.issue.findMany({
      where: {
        projectId: project.id,
        OR: [
          { issueKey: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: ISSUE_SELECT,
      orderBy: [
        { type: 'asc' }, // EPIC < STORY < TASK < BUG (alphabetical = logical)
        { issueKey: 'asc' },
      ],
    });
  }

  async findAll(projectId: string, type?: IssueType, assigneeId?: string, q?: string) {
    // Resolve project UUID
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectId }, { projectID: projectId }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project not found: ${projectId}`);

    return this.prisma.issue.findMany({
      where: {
        projectId: project.id,
        ...(type ? { type } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      },
      select: ISSUE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Returns a nested tree structure.
   * Root = any issue with parentId === null (any type — EPIC, orphan STORY, orphan TASK/BUG).
   */
  async getTree(projectId: string) {
    // Resolve project UUID
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectId }, { projectID: projectId }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project not found: ${projectId}`);

    const allIssues = await this.prisma.issue.findMany({
      where: { projectId: project.id },
      select: {
        ...ISSUE_SELECT,
        children: {
          select: {
            ...ISSUE_SELECT,
            children: {
              select: ISSUE_SELECT,
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Return ALL root-level issues (parentId === null), not just EPICs
    return allIssues.filter((issue) => issue.parentId === null);
  }

  async findOne(id: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      select: ISSUE_DETAIL_SELECT,
    });
    if (!issue) throw new NotFoundException(`Issue not found: ${id}`);
    return issue;
  }

  async update(id: string, dto: UpdateIssueDto) {
    const existing = await this.prisma.issue.findUnique({
      where: { id },
      select: { type: true, parentId: true, projectId: true },
    });
    if (!existing) throw new NotFoundException(`Issue not found: ${id}`);

    // Use the type from DTO if changing type, otherwise existing type
    const effectiveType = dto.type ?? existing.type;

    // ── EPIC container rules on update ───────────────────────────────────────
    // Never allow assigning status or assignee to an EPIC via normal update.
    if (effectiveType === IssueType.EPIC) {
      if (dto.assigneeId !== undefined) dto.assigneeId = null;
      if (dto.status !== undefined) delete dto.status;
    }

    // Re-validate hierarchy only if parentId is being changed
    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      await this.validateHierarchy(effectiveType, dto.parentId);
      // Circular reference check (only when setting a non-null parent)
      if (dto.parentId) {
        await this.detectCircularParent(id, dto.parentId);
      }
    }

    // Validate new assignee belongs to the project (requires projectId in dto)
    if (dto.assigneeId !== undefined && dto.assigneeId !== null && dto.projectId) {
      const proj = await this.prisma.project.findFirst({
        where: { OR: [{ id: dto.projectId }, { projectID: dto.projectId }] },
        select: { id: true },
      });
      if (proj) {
        const membership = await this.prisma.userRole.findFirst({
          where: { userId: dto.assigneeId, projectId: proj.id },
        });
        if (!membership) {
          throw new BadRequestException('Assignee must be a member of this project');
        }
      }
    }

    return this.prisma.issue.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.type !== undefined && { type: dto.type }),
        // Allow explicitly setting parentId to null (un-parent an issue)
        ...(dto.parentId !== undefined && { parentId: dto.parentId ?? null }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.estimate !== undefined && { estimate: dto.estimate ? (isNaN(Number(dto.estimate)) ? dto.estimate : `${dto.estimate}h`) : null }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
      },
      select: ISSUE_DETAIL_SELECT,
    });
  }

  /**
   * PATCH /issues/:id/complete
   * Toggles isCompleted on an EPIC. Non-EPICs throw BadRequest.
   */
  async completeEpic(id: string, isCompleted: boolean) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      select: { type: true },
    });
    if (!issue) throw new NotFoundException(`Issue not found: ${id}`);
    if (issue.type !== IssueType.EPIC) {
      throw new BadRequestException('Only EPICs can be marked as completed via this endpoint');
    }
    return this.prisma.issue.update({
      where: { id },
      data: { isCompleted },
      select: ISSUE_SELECT,
    });
  }

  /**
   * GET /issues/kanban?projectId=<id>
   * Returns flat issues excluding EPIC — Task, Bug, Story only.
   * Includes parentId for accordion grouping on the client.
   */
  async getKanban(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectId }, { projectID: projectId }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project not found: ${projectId}`);

    return this.prisma.issue.findMany({
      where: {
        projectId: project.id,
        type: { not: IssueType.EPIC }, // Kanban shows only Task / Bug / Story
      },
      select: ISSUE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * GET /projects/:id/progress
   * Returns team progress aggregation — per-member task counts.
   * Computed on the fly; nothing is stored.
   *
   * Response shape:
   * [
   *   { userId, name, email, totalTasks, completedTasks, inProgressTasks, todoTasks },
   *   ... (one entry per project member),
   *   { userId: 'unassigned', name: 'Unassigned', totalTasks, completedTasks, ... }
   * ]
   */
  async getProgress(projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectId }, { projectID: projectId }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project not found: ${projectId}`);

    // Fetch all non-EPIC issues for the project with assignee info
    const issues = await this.prisma.issue.findMany({
      where: {
        projectId: project.id,
        type: { not: IssueType.EPIC }, // Progress tracks work items only
      },
      select: {
        id: true,
        status: true,
        type: true,
        assigneeId: true,
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Fetch project members for the full roster (includes members with 0 issues)
    const members = await this.prisma.userRole.findMany({
      where: { projectId: project.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Build a map: userId → counts
    const progressMap = new Map<string, {
      userId: string;
      name: string;
      email: string;
      totalTasks: number;
      completedTasks: number;
      inProgressTasks: number;
      todoTasks: number;
    }>();

    // Seed the map with all project members (so members with 0 tasks appear)
    for (const m of members) {
      progressMap.set(m.user.id, {
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        todoTasks: 0,
      });
    }

    // Tally the issues
    let unassignedTotal = 0, unassignedDone = 0, unassignedInProgress = 0, unassignedTodo = 0;

    for (const issue of issues) {
      if (!issue.assigneeId || !issue.assignee) {
        // Bucket unassigned issues separately
        unassignedTotal++;
        if (issue.status === 'DONE') unassignedDone++;
        else if (issue.status === 'IN_PROGRESS') unassignedInProgress++;
        else unassignedTodo++;
        continue;
      }

      let entry = progressMap.get(issue.assigneeId);
      if (!entry) {
        // Assignee is no longer a member but still has issues — include anyway
        entry = {
          userId: issue.assignee.id,
          name: issue.assignee.name,
          email: issue.assignee.email,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          todoTasks: 0,
        };
        progressMap.set(issue.assigneeId, entry);
      }

      entry.totalTasks++;
      if (issue.status === 'DONE') entry.completedTasks++;
      else if (issue.status === 'IN_PROGRESS') entry.inProgressTasks++;
      else entry.todoTasks++;
    }

    const result = Array.from(progressMap.values());

    // Append unassigned bucket if it has any issues
    if (unassignedTotal > 0) {
      result.push({
        userId: 'unassigned',
        name: 'Unassigned',
        email: '',
        totalTasks: unassignedTotal,
        completedTasks: unassignedDone,
        inProgressTasks: unassignedInProgress,
        todoTasks: unassignedTodo,
      });
    }

    return result;
  }

  async remove(id: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: { children: { select: { id: true } } },
    });
    if (!issue) throw new NotFoundException(`Issue not found: ${id}`);

    if (issue.children.length > 0) {
      throw new BadRequestException(
        `Cannot delete issue with ${issue.children.length} child issue(s). Delete or reassign children first.`,
      );
    }

    await this.prisma.issue.delete({ where: { id } });
    return { deleted: true, id };
  }
}
