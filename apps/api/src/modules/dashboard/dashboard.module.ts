import { Module } from '@nestjs/common';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary.use-case';
import { DashboardRepository } from './domain/repositories/dashboard.repository';
import { PrismaDashboardRepository } from './infrastructure/repositories/prisma-dashboard.repository';
import { DashboardController } from './presentation/controllers/dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [
    GetDashboardSummaryUseCase,
    {
      provide: DashboardRepository,
      useClass: PrismaDashboardRepository,
    },
  ],
})
export class DashboardModule {}
