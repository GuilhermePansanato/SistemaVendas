import { SystemModuleKey } from '@prisma/client';

export interface PlatformCompanyAdminUserSummary {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface PlatformCompanySummary {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  modules: SystemModuleKey[];
  adminUsers: PlatformCompanyAdminUserSummary[];
}
