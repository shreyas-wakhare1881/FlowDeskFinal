import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IssueLinksService } from './issue-links.service';
import { CreateIssueLinkDto } from './issue-links.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@UseGuards(JwtAuthGuard)
@Controller('issue-links')
export class IssueLinksController {
  constructor(private readonly issueLinksService: IssueLinksService) {}

  // POST /api/issue-links  — requires UPDATE_ISSUE permission (link = mutating an issue)
  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('UPDATE_ISSUE')
  create(@Body() dto: CreateIssueLinkDto) {
    return this.issueLinksService.create(dto);
  }

  // DELETE /api/issue-links/:id?projectId=<id>
  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('UPDATE_ISSUE')
  remove(
    @Param('id') id: string,
    // projectId in query is used by PermissionGuard for project context
    @Query('projectId') _projectId: string,
  ) {
    return this.issueLinksService.remove(id);
  }
}
