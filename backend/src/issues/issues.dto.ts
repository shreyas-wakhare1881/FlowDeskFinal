import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { IssueType, IssueStatus, IssuePriority } from '@prisma/client';

export class CreateIssueDto {
  @IsString()
  projectId: string;

  @IsEnum(IssueType)
  type: IssueType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  /**
   * Optional for all types except EPIC (EPIC cannot have a parent).
   * When provided: STORY→parent must be EPIC; TASK/BUG→parent must be STORY or EPIC.
   */
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;
}

export class UpdateIssueDto {
  /**
   * projectId MUST be passed on updates so PermissionGuard can resolve project context.
   */
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  /**
   * Pass null explicitly to remove parent (un-parent an issue).
   * Pass a UUID string to set a new parent.
   */
  @IsOptional()
  parentId?: string | null;

  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;
}
