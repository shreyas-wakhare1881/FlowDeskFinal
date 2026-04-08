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
  Req,
} from '@nestjs/common';
import { IssueType } from '@prisma/client';
import { IssuesService } from './issues.service';
import { CreateIssueCommentDto, CreateIssueDto, UpdateIssueDto } from './issues.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@UseGuards(JwtAuthGuard)
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  // ── Routes that must come BEFORE /:id ────────────────────────────────────

  // GET /api/issues/tree?projectId=<id>
  @Get('tree')
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  getTree(@Query('projectId') projectId: string) {
    return this.issuesService.getTree(projectId);
  }

  // GET /api/issues/kanban?projectId=<id>&filter=recently_updated|assigned_to_me
  // Returns ONLY Task / Bug / Story — excludes EPIC — for the Kanban board view.
  @Get('kanban')
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  getKanban(
    @Query('projectId') projectId: string,
    @Query('filter') filter?: string,
    @Req() req?: any,
  ) {
    const currentUserId = req?.user?.userId as string | undefined;
    return this.issuesService.getKanban(projectId, filter, currentUserId);
  }

  // GET /api/issues/search?q=<query>&projectId=<id>
  // Unified search: matches query against issueKey OR title (all types)
  // Returns flat results with hierarchy info for accordion UI.
  @Get('search')
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  search(
    @Query('q') q: string,
    @Query('projectId') projectId: string,
  ) {
    return this.issuesService.search(q, projectId);
  }

  // ── Standard CRUD ────────────────────────────────────────────────────────

  // POST /api/issues
  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('CREATE_ISSUE')
  create(@Body() dto: CreateIssueDto, @Req() req: any) {
    dto.reporterId = req.user.userId;
    return this.issuesService.create(dto);
  }

  // GET /api/issues?projectId=<id>&type=EPIC&assigneeId=<uuid>&q=search&filter=recently_updated
  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  findAll(
    @Query('projectId') projectId: string,
    @Query('type') type?: IssueType,
    @Query('assigneeId') assigneeId?: string,
    @Query('q') q?: string,
    @Query('filter') filter?: string,
  ) {
    return this.issuesService.findAll(projectId, type, assigneeId, q, filter);
  }

  @Get(':id/comments')
  @UseGuards(PermissionGuard)
  @RequirePermission('VIEW_COMMENT')
  getComments(@Param('id') id: string, @Query('projectId') projectId: string) {
    return this.issuesService.getComments(id, projectId);
  }

  @Post(':id/comments')
  @UseGuards(PermissionGuard)
  @RequirePermission('ADD_COMMENT')
  addComment(@Param('id') id: string, @Body() dto: CreateIssueCommentDto, @Req() req: any) {
    return this.issuesService.createComment(id, dto.projectId, req.user.userId, dto.content);
  }

  // GET /api/issues/:id
  @Get(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  findOne(@Param('id') id: string, @Query('projectId') projectId: string) {
    return this.issuesService.findOne(id, projectId);
  }

  // PATCH /api/issues/:id  — projectId in body (required by PermissionGuard)
  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('UPDATE_ISSUE')
  update(@Param('id') id: string, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(id, dto);
  }

  // PATCH /api/issues/:id/complete
  // Toggles isCompleted on an EPIC. Body: { isCompleted: boolean, projectId: string }
  @Patch(':id/complete')
  @UseGuards(PermissionGuard)
  @RequirePermission('UPDATE_ISSUE')
  completeEpic(
    @Param('id') id: string,
    @Body() body: { isCompleted: boolean; projectId: string },
  ) {
    return this.issuesService.completeEpic(id, body.isCompleted);
  }

  // DELETE /api/issues/:id?projectId=<id>
  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('DELETE_ISSUE')
  remove(@Param('id') id: string) {
    return this.issuesService.remove(id);
  }
}
