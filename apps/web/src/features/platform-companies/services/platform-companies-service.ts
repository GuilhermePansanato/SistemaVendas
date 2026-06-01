import { platformApiClient } from '../../../shared/services/platform-api-client';
import type {
  CreatePlatformCompanyInput,
  PlatformCompany,
  ResetPlatformCompanyUserPasswordInput,
  UpdatePlatformCompanyModulesInput,
  UpdatePlatformCompanyStatusInput,
} from '../types/platform-company';

export async function getPlatformCompanies() {
  const response = await platformApiClient.get<PlatformCompany[]>('/companies');
  return response.data;
}

export async function createPlatformCompany(input: CreatePlatformCompanyInput) {
  const response = await platformApiClient.post<PlatformCompany>(
    '/companies',
    input,
  );
  return response.data;
}

export async function updatePlatformCompanyModules(
  companyId: string,
  input: UpdatePlatformCompanyModulesInput,
) {
  const response = await platformApiClient.patch<PlatformCompany>(
    `/companies/${companyId}/modules`,
    input,
  );
  return response.data;
}

export async function updatePlatformCompanyStatus(
  companyId: string,
  input: UpdatePlatformCompanyStatusInput,
) {
  const response = await platformApiClient.patch<PlatformCompany>(
    `/companies/${companyId}/status`,
    input,
  );
  return response.data;
}

export async function resetPlatformCompanyUserPassword(
  companyId: string,
  userId: string,
  input: ResetPlatformCompanyUserPasswordInput,
) {
  const response = await platformApiClient.patch<{
    success: boolean;
    message: string;
  }>(`/companies/${companyId}/users/${userId}/password`, input);
  return response.data;
}
