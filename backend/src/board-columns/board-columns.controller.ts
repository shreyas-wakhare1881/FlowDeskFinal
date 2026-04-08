import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BoardColumnsService } from './board-columns.service';
import {
  CreateBoardColumnDto,
  UpdateBoardColumnDto,
  ReorderColumnsDto,
  DeleteColumnOptionsDto,
} from './board-columns.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@UseGuards(JwtAuthGuard)
@Controller('board-columns')
export class BoardColumnsController {
  constructor(private readonly boardColumnsService: BoardColumnsService) {}

  /**
   * GET /api/board-columns?projectId=<id>
   * Returns all columns for a project sorted by position.
   * Auto-seeds default columns (To Do / In Progress / Done) on first call.
   */
  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  findAll(@Query('projectId') projectId: string) {
    return this.boardColumnsService.findAll(projectId);
  }

  /**
   * POST /api/board-columns
   * Creates a new column at the end of the board.
   * Body: { name, projectId, color? }
   */
  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('CREATE_ISSUE')
  create(@Body() dto: CreateBoardColumnDto) {
    return this.boardColumnsService.create(dto);
  }

  /**
   * PATCH /api/board-columns/reorder
   * Bulk-updates column positions.
   * Body: { columns: [{ id, position }], projectId }
   *
   * NOTE: This route MUST be declared BEFORE /:id to avoid routing conflicts.
   */
  @Patch('reorder')
  @UseGuards(PermissionGuard)
  @RequirePermission('UPDATE_ISSUE')
  reorder(@Body() dto: ReorderColumnsDto) {
    return this.boardColumnsService.reorder(dto);
  }

  /**
   * PATCH /api/board-columns/:id
   * Renames or recolors a column.
   * Body: { name?, color?, projectId }
   */
  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('UPDATE_ISSUE')
  update(@Param('id') id: string, @Body() dto: UpdateBoardColumnDto) {
    return this.boardColumnsService.update(id, dto);
  }

  /**
   * DELETE /api/board-columns/:id
   * Deletes a column.
   * Body: { projectId, moveToColumnId? }
   * - If moveToColumnId is given → moves issues there before deletion.
   * - Otherwise → sets columnId = null on affected issues.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PermissionGuard)
  @RequirePermission('DELETE_ISSUE')
  async delete(
    @Param('id') id: string,
    @Body() dto: DeleteColumnOptionsDto,
  ) {
    await this.boardColumnsService.delete(id, dto.projectId, dto.moveToColumnId);
  }
}
