import { SystemModuleKey } from '@prisma/client';
import { ArrayMinSize, ArrayUnique, IsArray, IsEnum } from 'class-validator';

export class UpdatePlatformCompanyModulesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsEnum(SystemModuleKey, {
    each: true,
  })
  moduleKeys!: SystemModuleKey[];
}
