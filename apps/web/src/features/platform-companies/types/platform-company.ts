export interface PlatformCompanyAdminUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

export interface PlatformCompany {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  modules: string[];
  adminUsers: PlatformCompanyAdminUser[];
}

export interface CreatePlatformCompanyInput {
  name: string;
  slug?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  moduleKeys: string[];
}

export interface UpdatePlatformCompanyModulesInput {
  moduleKeys: string[];
}

export interface UpdatePlatformCompanyStatusInput {
  isActive: boolean;
}

export interface ResetPlatformCompanyUserPasswordInput {
  newPassword: string;
}
