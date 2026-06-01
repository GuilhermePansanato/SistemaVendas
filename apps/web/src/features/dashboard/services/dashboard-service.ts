import { apiClient } from '../../../shared/services/api-client';
import type { DashboardSummary } from '../types/dashboard';

export interface DashboardSummaryFilters {
  from?: string;
  to?: string;
}

export async function getDashboardSummary(filters?: DashboardSummaryFilters) {
  const response = await apiClient.get<DashboardSummary>('/dashboard/summary', {
    params: {
      ...(filters?.from ? { from: filters.from } : {}),
      ...(filters?.to ? { to: filters.to } : {}),
    },
  });

  return response.data;
}
