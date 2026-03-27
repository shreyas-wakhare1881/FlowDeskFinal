import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @MinLength(6)
  password: string;

  @IsOptional() @IsString()
  role?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString() @IsNotEmpty()
  password: string;
}
