import { IsString, IsOptional, IsBoolean, IsDateString, IsArray } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  taskName: string;

  @IsOptional()
  @IsString()
  taskDescription?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsString()
  priority: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurringFrequency?: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  projectId: string;

  @IsOptional()
  @IsArray()
  assigneeNames?: string[];
}

export class UpdateTaskDto {
  /**
   * projectId MUST be passed by clients on update/delete so PermissionGuard
   * can resolve the project context from body.projectId.
   * (Guard cannot derive project from params.id since that is a task UUID)
   */
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  taskName?: string;

  @IsOptional()
  @IsString()
  taskDescription?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsString()
  recurringFrequency?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  assigneeNames?: string[];
}
