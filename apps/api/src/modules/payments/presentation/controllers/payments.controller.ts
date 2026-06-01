import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SystemModuleKey } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/infrastructure/security/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/http/current-user.decorator';
import type { JwtUser } from '../../../auth/presentation/http/jwt-user';
import { RequireSystemModule } from '../../../../shared/security/require-system-module.decorator';
import { TenantModuleAccessGuard } from '../../../../shared/security/tenant-module-access.guard';
import { CreatePaymentDto } from '../../application/dto/create-payment.dto';
import { PaymentQueryDto } from '../../application/dto/payment-query.dto';
import { ReopenInstallmentDto } from '../../application/dto/reopen-installment.dto';
import { ListPaymentsUseCase } from '../../application/use-cases/list-payments.use-case';
import { ReopenInstallmentUseCase } from '../../application/use-cases/reopen-installment.use-case';
import { RegisterPaymentUseCase } from '../../application/use-cases/register-payment.use-case';

@Controller()
@UseGuards(JwtAuthGuard, TenantModuleAccessGuard)
@RequireSystemModule(SystemModuleKey.SALES)
export class PaymentsController {
  constructor(
    private readonly listPaymentsUseCase: ListPaymentsUseCase,
    private readonly registerPaymentUseCase: RegisterPaymentUseCase,
    private readonly reopenInstallmentUseCase: ReopenInstallmentUseCase,
  ) {}

  @Get('payments')
  list(@CurrentUser() currentUser: JwtUser, @Query() query: PaymentQueryDto) {
    return this.listPaymentsUseCase.execute(currentUser.companyId, {
      search: query.search?.trim() || undefined,
      installmentId: query.installmentId || undefined,
      customerId: query.customerId || undefined,
      method: query.method,
      paidFrom: query.paidFrom,
      paidTo: query.paidTo,
    });
  }

  @Post('installments/:installmentId/payments')
  create(
    @CurrentUser() currentUser: JwtUser,
    @Param('installmentId') installmentId: string,
    @Body() input: CreatePaymentDto,
  ) {
    return this.registerPaymentUseCase.execute(
      currentUser.companyId,
      installmentId,
      input,
    );
  }

  @Post('installments/:installmentId/reopen')
  @HttpCode(200)
  reopenInstallment(
    @Param('installmentId') installmentId: string,
    @CurrentUser() currentUser: JwtUser,
    @Body() input: ReopenInstallmentDto,
  ) {
    return this.reopenInstallmentUseCase.execute(
      currentUser.companyId,
      installmentId,
      currentUser.userId,
      input,
    );
  }
}
