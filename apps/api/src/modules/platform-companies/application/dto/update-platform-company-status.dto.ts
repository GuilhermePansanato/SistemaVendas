import { IsBoolean } from 'class-validator';

export class UpdatePlatformCompanyStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
