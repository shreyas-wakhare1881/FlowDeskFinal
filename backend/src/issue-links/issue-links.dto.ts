import { IsString, IsEnum, IsUUID } from 'class-validator';
import { IssueLinkType } from '@prisma/client';

export class CreateIssueLinkDto {
  /** The project this link belongs to (used by PermissionGuard) */
  @IsString()
  projectId: string;

  @IsUUID()
  sourceIssueId: string;

  @IsUUID()
  targetIssueId: string;

  @IsEnum(IssueLinkType)
  linkType: IssueLinkType;
}
