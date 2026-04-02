import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { IssuesService } from '../issues/issues.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly issuesService: IssuesService,
  ) {}

  // ── New RBAC routes — declared BEFORE /:id to avoid route conflicts ────────

  /**
   * GET /projects/my
   * Returns only projects where the current user has a role.
   */
  @Get('my')
  getMyProjects(@Request() req: any) {
    return this.projectsService.findMyProjects(req.user.userId);
  }

  // ── Existing routes ────────────────────────────────────────────────────────

  /**
   * POST /projects
   * Creates a project and auto-assigns the creator as Manager in user_roles.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProjectDto: CreateProjectDto, @Request() req: any) {
    return this.projectsService.create(createProjectDto, req.user.userId);
  }

  /**
   * GET /projects
   * ⚠️  RBAC NOTE: This returns ALL projects regardless of membership.
   * It is intentionally restricted to SuperAdmin only via PermissionGuard.
   * Regular callers must use GET /projects/my instead.
   * The guard resolves SuperAdmin status from any project the user belongs to.
   */
  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('MANAGE_USERS')   // only SuperAdmin has MANAGE_USERS
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '1000',
  ) {
    return this.projectsService.findAll({ page: +page, limit: +limit });
  }

  @Get('stats')
  async getStats() {
    return this.projectsService.getStats();
  }

  /**
   * GET /projects/roles
   * Returns assignable roles (excludes SuperAdmin — only SuperAdmin can assign that).
   * Used by Manager UI when adding a member to pick a role from a dropdown.
   */
  @Get('roles')
  async getRoles() {
    return this.projectsService.getAssignableRoles();
  }

  /**
   * GET /projects/:id
   * Requires VIEW_PROJECT permission — enforces membership check.
   */
  @Get(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('VIEW_PROJECT')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get('project-id/:projectID')
  async findByProjectID(@Param('projectID') projectID: string) {
    return this.projectsService.findByProjectID(projectID);
  }

  /**
   * PUT /projects/:id
   * Requires UPDATE_PROJECT permission in this project.
   */
  @Put(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('UPDATE_PROJECT')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  /**
   * DELETE /projects/:id
   * Requires MANAGE_PROJECTS permission (SuperAdmin + Manager).
   * SuperAdmin can delete any project; Manager can only delete projects they created.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(PermissionGuard)
  @RequirePermission('MANAGE_PROJECTS')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.projectsService.remove(id, req.user.userId);
  }

  // ── RBAC: Project permission & member management ───────────────────────────

  /**
   * GET /projects/:id/permissions
   * Returns the current user's role + permission list for this project.
   */
  @Get(':id/permissions')
  getMyPermissions(@Param('id') id: string, @Request() req: any) {
    return this.projectsService.getMyPermissions(id, req.user.userId);
  }

  /**
   * GET /projects/:id/progress
   * Returns per-member task aggregation for the Team Progress section.
   * Delegates to IssuesService.getProgress() — computed on the fly, nothing stored.
   */
  @Get(':id/progress')
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_ISSUE')
  getProgress(@Param('id') id: string) {
    return this.issuesService.getProgress(id);
  }

  /**
   * GET /projects/:id/members
   * Lists all members and their roles. Requires VIEW_TEAM.
   */
  @Get(':id/members')
  @UseGuards(PermissionGuard)
  @RequirePermission('VIEW_TEAM')
  getMembers(@Param('id') id: string) {
    return this.projectsService.getMembers(id);
  }

  /**
   * POST /projects/:id/members
   * Adds a user to this project with a role. Requires MANAGE_TEAM.
   */
  @Post(':id/members')
  @UseGuards(PermissionGuard)
  @RequirePermission('MANAGE_TEAM')
  addMember(
    @Param('id') id: string,
    @Body() body: { userId: string; roleId: string },
    @Request() req: any,
  ) {
    return this.projectsService.addMember(id, body.userId, body.roleId, req.user.userId);
  }

  /**
   * DELETE /projects/:id/members/:userId
   * Removes a user from this project. Requires MANAGE_TEAM.
   */
  @Delete(':id/members/:userId')
  @UseGuards(PermissionGuard)
  @RequirePermission('MANAGE_TEAM')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, userId);
  }

  /**
   * PUT /projects/:id/members/:userId
   * Changes an existing member's role in the project. Requires MANAGE_TEAM.
   */
  @Put(':id/members/:userId')
  @UseGuards(PermissionGuard)
  @RequirePermission('MANAGE_TEAM')
  updateMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() body: { roleId: string },
    @Request() req: any,
  ) {
    return this.projectsService.updateMemberRole(id, userId, body.roleId, req.user.userId);
  }

  /**
   * POST /projects/:id/assign-manager
   * SuperAdmin assigns a registered user as Manager in a project.
   * Only SuperAdmin can call this (MANAGE_USERS is SuperAdmin-only permission).
   * Body: { userId: string }
   *
   * This is the primary flow for:
   *   SuperAdmin → Create Project → Assign Manager → Manager logs in & sees project
   */
  @Post(':id/assign-manager')
  @UseGuards(PermissionGuard)
  @RequirePermission('MANAGE_USERS')
  assignManager(
    @Param('id') id: string,
    @Body() body: { userId: string },
    @Request() req: any,
  ) {
    return this.projectsService.assignManager(id, body.userId, req.user.userId);
  }
}
