import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBoardColumnDto,
  UpdateBoardColumnDto,
  ReorderColumnsDto,
  DeleteColumnOptionsDto,
} from './board-columns.dto';

const DEFAULT_COLUMNS = [
  { name: 'To Do',       position: 0, color: '#64748b' },
  { name: 'In Progress', position: 1, color: '#2563eb' },
  { name: 'Done',        position: 2, color: '#16a34a' },
];

const COLUMN_SELECT = {
  id: true,
  name: true,
  position: true,
  color: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { issues: true } },
} as const;

@Injectable()
export class BoardColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves project UUID from either UUID or projectID (e.g. "PRJ-001").
   */
  private async resolveProjectId(projectId: string): Promise<string> {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: projectId }, { projectID: projectId }] },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project not found: ${projectId}`);
    return project.id;
  }

  /**
   * Returns all columns for a project, sorted by position ASC.
   * If none exist yet, seeds 3 default columns (To Do / In Progress / Done)
   * and assigns existing issues to the correct column based on their current status.
   */
  async findAll(projectId: string) {
    const resolvedId = await this.resolveProjectId(projectId);

    let columns = await this.prisma.boardColumn.findMany({
      where: { projectId: resolvedId },
      select: COLUMN_SELECT,
      orderBy: { position: 'asc' },
    });

    if (columns.length === 0) {
      // Seed default columns inside a transaction
      columns = await this.seedDefaultColumns(resolvedId);
    }

    return columns;
  }

  /**
   * Creates 3 default columns and assigns existing issues to them by status.
   * Called automatically on first Kanban board load for a project.
   */
  private async seedDefaultColumns(resolvedProjectId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Create default columns
      const created = await Promise.all(
        DEFAULT_COLUMNS.map((col) =>
          tx.boardColumn.create({
            data: { ...col, projectId: resolvedProjectId },
            select: COLUMN_SELECT,
          }),
        ),
      );

      // Map status → column id
      const todoCol       = created.find((c) => c.name === 'To Do')!;
      const inProgressCol = created.find((c) => c.name === 'In Progress')!;
      const doneCol       = created.find((c) => c.name === 'Done')!;

      // Backfill existing issues → assign to column based on current status
      await tx.issue.updateMany({
        where: { projectId: resolvedProjectId, status: 'TODO' },
        data: { columnId: todoCol.id },
      });
      await tx.issue.updateMany({
        where: { projectId: resolvedProjectId, status: 'IN_PROGRESS' },
        data: { columnId: inProgressCol.id },
      });
      await tx.issue.updateMany({
        where: { projectId: resolvedProjectId, status: 'DONE' },
        data: { columnId: doneCol.id },
      });

      return created.sort((a, b) => a.position - b.position);
    });
  }

  /**
   * Creates a new custom column at the end (max_position + 1).
   */
  async create(dto: CreateBoardColumnDto) {
    const resolvedId = await this.resolveProjectId(dto.projectId);

    // Find current max position
    const last = await this.prisma.boardColumn.findFirst({
      where: { projectId: resolvedId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPosition = last ? last.position + 1 : 0;

    return this.prisma.boardColumn.create({
      data: {
        name: dto.name,
        position: nextPosition,
        color: dto.color ?? '#5B8FEF',
        projectId: resolvedId,
      },
      select: COLUMN_SELECT,
    });
  }

  /**
   * Updates column name and/or color.
   */
  async update(id: string, dto: UpdateBoardColumnDto) {
    await this.assertExists(id);

    return this.prisma.boardColumn.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
      select: COLUMN_SELECT,
    });
  }

  /**
   * Bulk-reorders columns using position values from the request.
   * All column IDs must belong to the same project.
   * Uses a transaction to atomically update all positions.
   *
   * Strategy: set to negative temporaries first to avoid unique-constraint collisions,
   * then set final values. PostgreSQL doesn't have DEFERRED unique on position,
   * so we use a two-phase update only if needed.
   * Since position is NOT unique (only ordered), single-pass is fine.
   */
  async reorder(dto: ReorderColumnsDto) {
    const resolvedId = await this.resolveProjectId(dto.projectId);

    // Validate all column IDs belong to this project
    const validColumns = await this.prisma.boardColumn.findMany({
      where: { projectId: resolvedId },
      select: { id: true },
    });
    const validIds = new Set(validColumns.map((c) => c.id));

    for (const item of dto.columns) {
      if (!validIds.has(item.id)) {
        throw new BadRequestException(
          `Column ${item.id} does not belong to project ${dto.projectId}`,
        );
      }
    }

    // Atomically update all positions
    await this.prisma.$transaction(
      dto.columns.map((item) =>
        this.prisma.boardColumn.update({
          where: { id: item.id },
          data: { position: item.position },
        }),
      ),
    );

    // Return updated list
    return this.prisma.boardColumn.findMany({
      where: { projectId: resolvedId },
      select: COLUMN_SELECT,
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Deletes a column.
   *
   * Edge cases:
   * 1. `moveToColumnId` provided → move all issues to that column first.
   * 2. No `moveToColumnId` → set columnId = NULL on affected issues (unassigned).
   * 3. Cannot delete the LAST column in a project (at least 1 must remain).
   */
  async delete(id: string, projectId: string, moveToColumnId?: string) {
    const resolvedId = await this.resolveProjectId(projectId);
    await this.assertExists(id);

    // Guard: cannot delete the last column
    const total = await this.prisma.boardColumn.count({
      where: { projectId: resolvedId },
    });
    if (total <= 1) {
      throw new BadRequestException(
        'Cannot delete the last column. A project must have at least one column.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (moveToColumnId) {
        // Validate target column exists and belongs to same project
        const target = await tx.boardColumn.findFirst({
          where: { id: moveToColumnId, projectId: resolvedId },
        });
        if (!target) {
          throw new BadRequestException(
            `Target column ${moveToColumnId} not found in this project`,
          );
        }
        // Move issues
        await tx.issue.updateMany({
          where: { columnId: id },
          data: { columnId: moveToColumnId },
        });
      } else {
        // Unassign issues from the deleted column
        await tx.issue.updateMany({
          where: { columnId: id },
          data: { columnId: null },
        });
      }

      // Delete the column
      await tx.boardColumn.delete({ where: { id } });

      // Compact positions to keep them contiguous (0, 1, 2, ...)
      const remaining = await tx.boardColumn.findMany({
        where: { projectId: resolvedId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      await Promise.all(
        remaining.map((col, idx) =>
          tx.boardColumn.update({
            where: { id: col.id },
            data: { position: idx },
          }),
        ),
      );
    });
  }

  private async assertExists(id: string) {
    const col = await this.prisma.boardColumn.findUnique({ where: { id } });
    if (!col) throw new NotFoundException(`Board column not found: ${id}`);
    return col;
  }
}
