import { IsString, MinLength } from 'class-validator';

export class ResetPlatformCompanyUserPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
