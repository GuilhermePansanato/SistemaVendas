import { Injectable } from '@nestjs/common';
import { SystemModuleKey } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  defaultPlatformModuleCatalog,
  PlatformModuleCatalogItem,
} from '../../domain/entities/platform-module';
import { PlatformModulesRepository } from '../../domain/repositories/platform-modules.repository';

function mapPlatformModule(record: {
  key: SystemModuleKey;
  name: string;
  description: string | null;
  isActive: boolean;
  isTenantVisible: boolean;
  sortOrder: number;
}): PlatformModuleCatalogItem {
  return {
    key: record.key,
    name: record.name,
    description: record.description,
    isActive: record.isActive,
    isTenantVisible: record.isTenantVisible,
    sortOrder: record.sortOrder,
  };
}

@Injectable()
export class PrismaPlatformModulesRepository implements PlatformModulesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async ensureCatalogSeeded(): Promise<void> {
    for (const module of defaultPlatformModuleCatalog) {
      await this.prismaService.systemModule.upsert({
        where: {
          key: module.key,
        },
        update: {
          name: module.name,
          description: module.description,
          isActive: true,
          isTenantVisible: true,
          sortOrder: module.sortOrder,
        },
        create: {
          key: module.key,
          name: module.name,
          description: module.description,
          isActive: true,
          isTenantVisible: true,
          sortOrder: module.sortOrder,
        },
      });
    }
  }

  async listTenantModules(): Promise<PlatformModuleCatalogItem[]> {
    const modules = await this.prismaService.systemModule.findMany({
      where: {
        isActive: true,
        isTenantVisible: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return modules.map(mapPlatformModule);
  }

  async listByKeys(
    keys: SystemModuleKey[],
  ): Promise<PlatformModuleCatalogItem[]> {
    const modules = await this.prismaService.systemModule.findMany({
      where: {
        key: {
          in: keys,
        },
        isActive: true,
        isTenantVisible: true,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });

    return modules.map(mapPlatformModule);
  }
}
