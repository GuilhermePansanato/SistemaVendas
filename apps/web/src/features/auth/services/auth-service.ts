import { apiClient } from '../../../shared/services/api-client';
import type {
  AuthUser,
  LoginInput,
  LoginResponse,
} from '../types/auth-session';

export async function loginRequest(input: LoginInput) {
  const response = await apiClient.post<LoginResponse>('/auth/login', input);
  return response.data;
}

export async function getProfileRequest() {
  const response = await apiClient.get<AuthUser>('/auth/me');
  return response.data;
}
