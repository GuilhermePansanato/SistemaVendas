import { SystemModuleKey } from '@prisma/client';
import { PlatformModuleCatalogItem } from '../entities/platform-module';

export abstract class PlatformModulesRepository {
  abstract ensureCatalogSeeded(): Promise<void>;
  abstract listTenantModules(): Promise<PlatformModuleCatalogItem[]>;
  abstract listByKeys(
    keys: SystemModuleKey[],
  ): Promise<PlatformModuleCatalogItem[]>;
}
