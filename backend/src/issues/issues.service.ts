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
  parentId: true,
  projectId: true,
  assigneeId: true,
  reporterId: true,
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
    // Resolve project UUID
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: dto.projectId }, { projectID: dto.projectId }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project not found: ${dto.projectId}`);

    await this.validateHierarchy(dto.type, dto.parentId);

    // Validate assignee belongs to the project
    if (dto.assigneeId) {
      const membership = await this.prisma.userRole.findFirst({
        where: { userId: dto.assigneeId, projectId: project.id },
      });
      if (!membership) {
        throw new BadRequestException(
          'Assignee must be a member of this project',
        );
      }
    }

    const issueKey = await this.generateIssueKey(dto.projectId);

    return this.prisma.issue.create({
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
      },
      select: ISSUE_SELECT,
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
      },
      select: ISSUE_DETAIL_SELECT,
    });
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
