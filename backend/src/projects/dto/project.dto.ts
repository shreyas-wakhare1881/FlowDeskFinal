import {
  IsString, IsOptional, IsBoolean, IsDateString,
  IsArray, IsNotEmpty, IsIn, ValidateNested, IsNumber, Min, Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class TeamLeadDto {
  @IsString() leadId: string;
  @IsString() name: string;
  @IsString() avatar: string;
  @IsString() avatarColor: string;
}

class TeamMemberDto {
  @IsString() memberId: string;
  @IsString() name: string;
  @IsString() avatar: string;
  @IsString() avatarColor: string;
  @IsString() role: string;
  @IsOptional() @IsString() status?: string;
}

class MetricsDto {
  @IsOptional() @IsNumber() @Min(0) @Max(100) completionPercentage?: number;
  @IsOptional() @IsNumber() @Min(0) tasksTotal?: number;
  @IsOptional() @IsNumber() @Min(0) tasksCompleted?: number;
  @IsOptional() @IsNumber() @Min(0) tasksInProgress?: number;
  @IsOptional() @IsNumber() @Min(0) tasksOverdue?: number;
}

export class CreateProjectDto {
  @IsString() @IsNotEmpty()
  projectName: string;

  @IsOptional() @IsString()
  projectDescription?: string;

  @IsString() @IsIn(['todo', 'in-progress', 'completed', 'overdue'])
  status: string;

  @IsString() @IsNotEmpty()
  statusLabel: string;

  @IsString() @IsIn(['critical', 'medium', 'low'])
  priority: string;

  @IsString() @IsNotEmpty()
  category: string;

  @IsDateString()
  assignedDate: Date;

  @IsDateString()
  dueDate: Date;

  @IsOptional() @IsString()
  teamID?: string;

  @IsOptional() @IsString()
  teamName?: string;

  @IsOptional() @IsString()
  assigneeID?: string;

  @IsOptional() @IsString()
  assigneeName?: string;

  @IsOptional() @IsString()
  assigneeAvatar?: string;

  @IsOptional() @IsString()
  assigneeAvatarColor?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsBoolean()
  isRecurring?: boolean;

  @IsOptional() @IsString()
  recurringFrequency?: string;

  @IsOptional() @ValidateNested() @Type(() => TeamLeadDto)
  teamLead?: TeamLeadDto;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TeamMemberDto)
  teamMembers?: TeamMemberDto[];

  @IsOptional() @ValidateNested() @Type(() => MetricsDto)
  metrics?: MetricsDto;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @IsNotEmpty()
  projectName?: string;

  @IsOptional() @IsString()
  projectDescription?: string;

  @IsOptional() @IsString() @IsIn(['todo', 'in-progress', 'completed', 'overdue'])
  status?: string;

  @IsOptional() @IsString()
  statusLabel?: string;

  @IsOptional() @IsString() @IsIn(['critical', 'medium', 'low'])
  priority?: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsDateString()
  dueDate?: Date;

  @IsOptional() @IsDateString()
  completedDate?: Date;

  @IsOptional() @IsString()
  teamName?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsBoolean()
  isRecurring?: boolean;

  @IsOptional() @IsString()
  recurringFrequency?: string;

  @IsOptional() @ValidateNested() @Type(() => MetricsDto)
  metrics?: MetricsDto;

  // ── Project Settings (Phase 3) ─────────────────────────────────────
  @IsOptional() @IsString()
  projectKey?: string;

  @IsOptional() @IsEnum(['PRIVATE', 'PUBLIC'])
  visibility?: 'PRIVATE' | 'PUBLIC';
}
