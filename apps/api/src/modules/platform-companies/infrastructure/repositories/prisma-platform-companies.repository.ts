import { Injectable } from '@nestjs/common';
import { Prisma, SystemModuleKey } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  CreatePlatformCompanyData,
  PlatformCompaniesRepository,
} from '../../domain/repositories/platform-companies.repository';
import { PlatformCompanySummary } from '../../domain/entities/platform-company';

const platformCompanyInclude = Prisma.validator<Prisma.CompanyInclude>()({
  users: {
    orderBy: [
      {
        createdAt: 'asc',
      },
    ],
  },
  moduleSubscriptions: {
    where: {
      isActive: true,
      module: {
        is: {
          isActive: true,
          isTenantVisible: true,
        },
      },
    },
    include: {
      module: {
        select: {
          sortOrder: true,
        },
      },
    },
  },
});

type PlatformCompanyRecord = Prisma.CompanyGetPayload<{
  include: typeof platformCompanyInclude;
}>;

function mapPlatformCompany(
  record: PlatformCompanyRecord,
): PlatformCompanySummary {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    modules: [...record.moduleSubscriptions]
      .sort(
        (left, right) =>
          left.module.sortOrder - right.module.sortOrder ||
          left.moduleKey.localeCompare(right.moduleKey),
      )
      .map((subscription) => subscription.moduleKey),
    adminUsers: record.users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
    })),
  };
}

@Injectable()
export class PrismaPlatformCompaniesRepository implements PlatformCompaniesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async list(): Promise<PlatformCompanySummary[]> {
    const companies = await this.prismaService.company.findMany({
      include: platformCompanyInclude,
      orderBy: [
        {
          createdAt: 'desc',
        },
      ],
    });

    return companies.map(mapPlatformCompany);
  }

  async create(
    data: CreatePlatformCompanyData,
  ): Promise<PlatformCompanySummary> {
    const company = await this.prismaService.company.create({
      data: {
        name: data.name,
        slug: data.slug,
        isActive: true,
        users: {
          create: {
            name: data.adminUser.name,
            email: data.adminUser.email,
            passwordHash: data.adminUser.passwordHash,
            role: 'ADMIN',
            isActive: true,
          },
        },
        moduleSubscriptions: {
          create: data.moduleKeys.map((moduleKey) => ({
            moduleKey,
            isActive: true,
          })),
        },
      },
      include: platformCompanyInclude,
    });

    return mapPlatformCompany(company);
  }

  async updateStatus(
    companyId: string,
    isActive: boolean,
  ): Promise<PlatformCompanySummary | null> {
    const company = await this.prismaService.company.updateMany({
      where: {
        id: companyId,
      },
      data: {
        isActive,
      },
    });

    if (company.count === 0) {
      return null;
    }

    const updatedCompany = await this.prismaService.company.findUnique({
      where: {
        id: companyId,
      },
      include: platformCompanyInclude,
    });

    return updatedCompany ? mapPlatformCompany(updatedCompany) : null;
  }

  async updateModules(
    companyId: string,
    moduleKeys: SystemModuleKey[],
  ): Promise<PlatformCompanySummary | null> {
    return this.prismaService.$transaction(async (transaction) => {
      const existingCompany = await transaction.company.findUnique({
        where: {
          id: companyId,
        },
      });

      if (!existingCompany) {
        return null;
      }

      await transaction.companyModuleSubscription.updateMany({
        where: {
          companyId,
        },
        data: {
          isActive: false,
        },
      });

      if (moduleKeys.length > 0) {
        await transaction.companyModuleSubscription.createMany({
          data: moduleKeys.map((moduleKey) => ({
            companyId,
            moduleKey,
            isActive: true,
          })),
          skipDuplicates: true,
        });

        await transaction.companyModuleSubscription.updateMany({
          where: {
            companyId,
            moduleKey: {
              in: moduleKeys,
            },
          },
          data: {
            isActive: true,
          },
        });
      }

      const company = await transaction.company.findUnique({
        where: {
          id: companyId,
        },
        include: platformCompanyInclude,
      });

      return company ? mapPlatformCompany(company) : null;
    });
  }

  async updateUserPassword(
    companyId: string,
    userId: string,
    passwordHash: string,
  ): Promise<boolean> {
    const updatedUser = await this.prismaService.user.updateMany({
      where: {
        id: userId,
        companyId,
      },
      data: {
        passwordHash,
      },
    });

    return updatedUser.count > 0;
  }
}
