import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto } from './teams.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // POST /api/teams
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTeamDto) {
    return this.teamsService.create(dto);
  }

  // GET /api/teams  OR  GET /api/teams?projectID=PRJ-001&page=1&limit=10
  @Get()
  findAll(
    @Query('projectID') projectID?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '1000',
  ) {
    return this.teamsService.findAll(projectID, { page: +page, limit: +limit });
  }

  // GET /api/teams/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  // PUT /api/teams/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamsService.update(id, dto);
  }

  // DELETE /api/teams/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.teamsService.remove(id);
  }
}
