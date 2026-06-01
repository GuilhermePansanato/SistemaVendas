import { SetMetadata } from '@nestjs/common';
import { SystemModuleKey } from '@prisma/client';

export const REQUIRED_SYSTEM_MODULE_KEY = 'required-system-module-key';

export function RequireSystemModule(moduleKey: SystemModuleKey) {
  return SetMetadata(REQUIRED_SYSTEM_MODULE_KEY, moduleKey);
}
