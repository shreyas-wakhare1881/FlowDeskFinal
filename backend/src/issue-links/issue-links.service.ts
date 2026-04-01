import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueLinkDto } from './issue-links.dto';

const LINKED_ISSUE_SELECT = {
  id: true,
  issueKey: true,
  type: true,
  title: true,
  status: true,
  priority: true,
  projectId: true,
  assignee: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class IssueLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIssueLinkDto) {
    // Cannot link an issue to itself
    if (dto.sourceIssueId === dto.targetIssueId) {
      throw new BadRequestException('Cannot link an issue to itself');
    }

    // Validate both issues exist
    const [source, target] = await Promise.all([
      this.prisma.issue.findUnique({ where: { id: dto.sourceIssueId }, select: { id: true, projectId: true } }),
      this.prisma.issue.findUnique({ where: { id: dto.targetIssueId }, select: { id: true, projectId: true } }),
    ]);
    if (!source) throw new NotFoundException(`Source issue not found: ${dto.sourceIssueId}`);
    if (!target) throw new NotFoundException(`Target issue not found: ${dto.targetIssueId}`);

    // Both issues must belong to the same project
    if (source.projectId !== target.projectId) {
      throw new BadRequestException('Cannot link issues from different projects');
    }

    // Prevent duplicate links
    try {
      const link = await this.prisma.issueLink.create({
        data: {
          sourceIssueId: dto.sourceIssueId,
          targetIssueId: dto.targetIssueId,
          linkType: dto.linkType,
        },
        select: {
          id: true,
          linkType: true,
          source: { select: LINKED_ISSUE_SELECT },
          target: { select: LINKED_ISSUE_SELECT },
          createdAt: true,
        },
      });
      return link;
    } catch (e: unknown) {
      // Prisma unique constraint violation code
      if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new ConflictException('This link already exists');
      }
      throw e;
    }
  }

  async remove(linkId: string) {
    const link = await this.prisma.issueLink.findUnique({ where: { id: linkId } });
    if (!link) throw new NotFoundException(`Issue link not found: ${linkId}`);

    await this.prisma.issueLink.delete({ where: { id: linkId } });
    return { deleted: true, id: linkId };
  }
}
