import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // POST /api/tasks — requires CREATE_TASK in the project
  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission('CREATE_TASK')
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  // GET /api/tasks  or  GET /api/tasks?projectId=<uuid>&page=1&limit=10
  // Step 2.10: READ_TASK guard (projectId comes from query)
  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_TASK')
  findAll(
    @Query('projectId') projectId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '1000',
  ) {
    return this.tasksService.findAll(projectId, { page: +page, limit: +limit });
  }

  // GET /api/tasks/stats/:projectId — requires READ_TASK
  @Get('stats/:projectId')
  @UseGuards(PermissionGuard)
  @RequirePermission('READ_TASK')
  getStats(@Param('projectId') projectId: string) {
    return this.tasksService.getStats(projectId);
  }

  // GET /api/tasks/task-id/:taskID
  @Get('task-id/:taskID')
  findByTaskID(@Param('taskID') taskID: string) {
    return this.tasksService.findByTaskID(taskID);
  }

  // GET /api/tasks/:id — no PermissionGuard here because we only have task UUID,
  // not projectId. Clients who need task-level RBAC should use GET /tasks?projectId=
  // which is guarded. This endpoint remains JwtAuthGuard-only (must be logged in).
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // PUT /api/tasks/:id — requires UPDATE_TASK
  @Put(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('UPDATE_TASK')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  // DELETE /api/tasks/:id — requires DELETE_TASK
  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission('DELETE_TASK')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
