import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SystemModuleKey } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/infrastructure/security/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/http/current-user.decorator';
import type { JwtUser } from '../../../auth/presentation/http/jwt-user';
import { RequireSystemModule } from '../../../../shared/security/require-system-module.decorator';
import { TenantModuleAccessGuard } from '../../../../shared/security/tenant-module-access.guard';
import { DashboardSummaryQueryDto } from '../../application/dto/dashboard-summary-query.dto';
import { GetDashboardSummaryUseCase } from '../../application/use-cases/get-dashboard-summary.use-case';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantModuleAccessGuard)
@RequireSystemModule(SystemModuleKey.DASHBOARD)
export class DashboardController {
  constructor(
    private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase,
  ) {}

  @Get('summary')
  getSummary(
    @CurrentUser() currentUser: JwtUser,
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.getDashboardSummaryUseCase.execute(
      currentUser.companyId,
      query,
    );
  }
}
