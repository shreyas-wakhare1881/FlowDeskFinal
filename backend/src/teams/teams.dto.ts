import { IsString, IsOptional, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TeamMemberDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() avatar: string;
  @IsString() @IsNotEmpty() color: string;
}

export class CreateTeamDto {
  @IsString() @IsNotEmpty()
  teamName: string;

  @IsString() @IsNotEmpty()
  projectID: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => TeamMemberDto)
  members: TeamMemberDto[];
}

export class UpdateTeamDto {
  @IsOptional() @IsString() @IsNotEmpty()
  teamName?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TeamMemberDto)
  members?: TeamMemberDto[];
}
