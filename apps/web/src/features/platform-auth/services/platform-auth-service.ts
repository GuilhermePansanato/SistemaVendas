import { platformApiClient } from '../../../shared/services/platform-api-client';
import type {
  PlatformAuthUser,
  PlatformLoginInput,
  PlatformLoginResponse,
} from '../types/platform-auth-session';

export async function platformLoginRequest(input: PlatformLoginInput) {
  const response = await platformApiClient.post<PlatformLoginResponse>(
    '/auth/login',
    input,
  );
  return response.data;
}

export async function getPlatformProfileRequest() {
  const response = await platformApiClient.get<PlatformAuthUser>('/auth/me');
  return response.data;
}
