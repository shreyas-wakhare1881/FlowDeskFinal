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
import { CreateIssueDto, UpdateIssueDto } from './issues.dto';
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

  // GET /api/issues/kanban?projectId=<id>
  // Returns ONLY Task / Bug / Story — excludes EPIC — for the Kanban board view.
  @Get('kanban')
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  getKanban(@Query('projectId') projectId: string) {
    return this.issuesService.getKanban(projectId);
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

  // GET /api/issues?projectId=<id>&type=EPIC&assigneeId=<uuid>&q=search
  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  findAll(
    @Query('projectId') projectId: string,
    @Query('type') type?: IssueType,
    @Query('assigneeId') assigneeId?: string,
    @Query('q') q?: string,
  ) {
    return this.issuesService.findAll(projectId, type, assigneeId, q);
  }

  // GET /api/issues/:id
  @Get(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  findOne(@Param('id') id: string, @Query('projectId') projectId: string) {
    return this.issuesService.findOne(id);
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
