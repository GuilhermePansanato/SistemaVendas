import type { DashboardSummary } from '../entities/dashboard-summary';

export interface DashboardSummaryFilters {
  from?: Date;
  to?: Date;
}

export abstract class DashboardRepository {
  abstract getSummary(
    companyId: string,
    filters?: DashboardSummaryFilters,
  ): Promise<DashboardSummary>;
}
