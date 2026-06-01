import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SystemModuleKey } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/infrastructure/security/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/http/current-user.decorator';
import type { JwtUser } from '../../../auth/presentation/http/jwt-user';
import { RequireSystemModule } from '../../../../shared/security/require-system-module.decorator';
import { TenantModuleAccessGuard } from '../../../../shared/security/tenant-module-access.guard';
import { GetInstallmentByIdUseCase } from '../../application/use-cases/get-installment-by-id.use-case';
import { ListInstallmentsUseCase } from '../../application/use-cases/list-installments.use-case';
import { InstallmentQueryDto } from '../../application/dto/installment-query.dto';

@Controller('installments')
@UseGuards(JwtAuthGuard, TenantModuleAccessGuard)
@RequireSystemModule(SystemModuleKey.SALES)
export class InstallmentsController {
  constructor(
    private readonly listInstallmentsUseCase: ListInstallmentsUseCase,
    private readonly getInstallmentByIdUseCase: GetInstallmentByIdUseCase,
  ) {}

  @Get()
  list(
    @CurrentUser() currentUser: JwtUser,
    @Query() query: InstallmentQueryDto,
  ) {
    return this.listInstallmentsUseCase.execute(currentUser.companyId, {
      search: query.search?.trim() || undefined,
      customerId: query.customerId || undefined,
      saleId: query.saleId || undefined,
      status: query.status,
      dueFrom: query.dueFrom,
      dueTo: query.dueTo,
    });
  }

  @Get(':id')
  getById(
    @CurrentUser() currentUser: JwtUser,
    @Param('id') installmentId: string,
  ) {
    return this.getInstallmentByIdUseCase.execute(
      currentUser.companyId,
      installmentId,
    );
  }
}
