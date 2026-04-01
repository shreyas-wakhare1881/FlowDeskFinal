import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { TeamsModule } from './teams/teams.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IssuesModule } from './issues/issues.module';
import { IssueLinksModule } from './issue-links/issue-links.module';

@Module({
  imports: [PrismaModule, AuthModule, ProjectsModule, TasksModule, TeamsModule, UsersModule, IssuesModule, IssueLinksModule],
})
export class AppModule {}
