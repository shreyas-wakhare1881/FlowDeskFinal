import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto, UpdateTeamDto } from './teams.dto';

const TEAM_INCLUDE = { members: true } as const;

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeamDto) {
    // Resolve project UUID from human-readable projectID (PRJ-001)
    const project = await this.prisma.project.findUnique({
      where: { projectID: dto.projectID },
    });
    if (!project) {
      throw new NotFoundException(`Project ${dto.projectID} not found`);
    }

    // Generate teamID based on total teams count
    const count = await this.prisma.team.count();
    const teamID = `TEAM-${String(count + 1).padStart(3, '0')}`;

    const team = await this.prisma.team.create({
      data: {
        teamID,
        teamName: dto.teamName,
        projectId: project.id,
        members: dto.members?.length
          ? {
              create: dto.members.map((m) => ({
                name: m.name,
                avatar: m.avatar,
                color: m.color,
              })),
            }
          : undefined,
      },
      include: TEAM_INCLUDE,
    });

    return team;
  }

  async findAll(projectID?: string, { page = 1, limit = 1000 }: { page?: number; limit?: number } = {}) {
    const skip = (page - 1) * limit;
    if (projectID) {
      const isUuid = projectID.length > 10 && !projectID.startsWith('PRJ-');
      const project = isUuid
        ? await this.prisma.project.findUnique({ where: { id: projectID } })
        : await this.prisma.project.findUnique({ where: { projectID } });

      if (!project) return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };

      const where = { projectId: project.id };
      const [data, total] = await Promise.all([
        this.prisma.team.findMany({ where, skip, take: limit, include: TEAM_INCLUDE, orderBy: { createdAt: 'asc' } }),
        this.prisma.team.count({ where }),
      ]);
      return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }

    const [data, total] = await Promise.all([
      this.prisma.team.findMany({ skip, take: limit, include: TEAM_INCLUDE, orderBy: { createdAt: 'desc' } }),
      this.prisma.team.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: TEAM_INCLUDE,
    });
    if (!team) throw new NotFoundException(`Team ${id} not found`);
    return team;
  }

  async update(id: string, dto: UpdateTeamDto) {
    await this.findOne(id);

    const team = await this.prisma.team.update({
      where: { id },
      data: {
        teamName: dto.teamName,
        members: dto.members
          ? {
              deleteMany: {},
              create: dto.members.map((m) => ({
                name: m.name,
                avatar: m.avatar,
                color: m.color,
              })),
            }
          : undefined,
      },
      include: TEAM_INCLUDE,
    });

    return team;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.team.delete({ where: { id } });
    return { message: `Team ${id} deleted` };
  }
}
