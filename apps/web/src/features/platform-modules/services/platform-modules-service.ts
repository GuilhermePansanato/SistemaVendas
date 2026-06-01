import { platformApiClient } from '../../../shared/services/platform-api-client';
import type { PlatformModule } from '../types/platform-module';

export async function getPlatformModules() {
  const response = await platformApiClient.get<PlatformModule[]>('/modules');
  return response.data;
}
