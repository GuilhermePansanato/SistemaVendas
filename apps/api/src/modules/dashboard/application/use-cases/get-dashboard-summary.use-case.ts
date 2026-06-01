import { BadRequestException, Injectable } from '@nestjs/common';
import type { DashboardSummaryQueryDto } from '../dto/dashboard-summary-query.dto';
import {
  DashboardRepository,
  type DashboardSummaryFilters,
} from '../../domain/repositories/dashboard.repository';

function parseDateInput(value: string, endOfDay = false) {
  const [year, month, day] = value.split('-').map(Number);

  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  execute(companyId: string, query?: DashboardSummaryQueryDto) {
    const filters: DashboardSummaryFilters = {
      ...(query?.from ? { from: parseDateInput(query.from) } : {}),
      ...(query?.to ? { to: parseDateInput(query.to, true) } : {}),
    };

    if (
      (filters.from && Number.isNaN(filters.from.getTime())) ||
      (filters.to && Number.isNaN(filters.to.getTime()))
    ) {
      throw new BadRequestException('Intervalo de datas invalido.');
    }

    if (
      filters.from &&
      filters.to &&
      filters.from.getTime() > filters.to.getTime()
    ) {
      throw new BadRequestException(
        'A data inicial nao pode ser maior que a data final.',
      );
    }

    return this.dashboardRepository.getSummary(companyId, filters);
  }
}
