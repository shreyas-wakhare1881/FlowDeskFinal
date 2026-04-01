import { Module } from '@nestjs/common';
import { IssueLinksService } from './issue-links.service';
import { IssueLinksController } from './issue-links.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IssueLinksController],
  providers: [IssueLinksService],
  exports: [IssueLinksService],
})
export class IssueLinksModule {}
