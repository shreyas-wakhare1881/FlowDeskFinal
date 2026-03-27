import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './tasks.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // POST /api/tasks
  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  // GET /api/tasks  or  GET /api/tasks?projectId=<uuid>&page=1&limit=10
  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '1000',
  ) {
    return this.tasksService.findAll(projectId, { page: +page, limit: +limit });
  }

  // GET /api/tasks/stats/:projectId
  @Get('stats/:projectId')
  getStats(@Param('projectId') projectId: string) {
    return this.tasksService.getStats(projectId);
  }

  // GET /api/tasks/task-id/:taskID
  @Get('task-id/:taskID')
  findByTaskID(@Param('taskID') taskID: string) {
    return this.tasksService.findByTaskID(taskID);
  }

  // GET /api/tasks/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // PUT /api/tasks/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  // DELETE /api/tasks/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
