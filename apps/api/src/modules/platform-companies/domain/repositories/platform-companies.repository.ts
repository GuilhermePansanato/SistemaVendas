import { SystemModuleKey } from '@prisma/client';
import { PlatformCompanySummary } from '../entities/platform-company';

export interface CreatePlatformCompanyData {
  name: string;
  slug: string;
  adminUser: {
    name: string;
    email: string;
    passwordHash: string;
  };
  moduleKeys: SystemModuleKey[];
}

export abstract class PlatformCompaniesRepository {
  abstract list(): Promise<PlatformCompanySummary[]>;
  abstract create(
    data: CreatePlatformCompanyData,
  ): Promise<PlatformCompanySummary>;
  abstract updateStatus(
    companyId: string,
    isActive: boolean,
  ): Promise<PlatformCompanySummary | null>;
  abstract updateModules(
    companyId: string,
    moduleKeys: SystemModuleKey[],
  ): Promise<PlatformCompanySummary | null>;
  abstract updateUserPassword(
    companyId: string,
    userId: string,
    passwordHash: string,
  ): Promise<boolean>;
}
