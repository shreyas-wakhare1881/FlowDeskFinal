import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, Min, IsHexColor } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBoardColumnDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateBoardColumnDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  /** Required by PermissionGuard to resolve the user's role in the project */
  @IsString()
  @IsNotEmpty()
  projectId!: string;
}

export class ReorderItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsNumber()
  @Min(0)
  position!: number;
}

export class ReorderColumnsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  columns!: ReorderItemDto[];

  /** Required by PermissionGuard */
  @IsString()
  @IsNotEmpty()
  projectId!: string;
}

export class DeleteColumnOptionsDto {
  /** If provided, issues in the deleted column are moved here; otherwise they become column-less */
  @IsOptional()
  @IsString()
  moveToColumnId?: string;

  /** Required by PermissionGuard */
  @IsString()
  @IsNotEmpty()
  projectId!: string;
}
