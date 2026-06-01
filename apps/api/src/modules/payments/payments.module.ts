import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ListPaymentsUseCase } from './application/use-cases/list-payments.use-case';
import { ReopenInstallmentUseCase } from './application/use-cases/reopen-installment.use-case';
import { RegisterPaymentUseCase } from './application/use-cases/register-payment.use-case';
import { PaymentsRepository } from './domain/repositories/payments.repository';
import { PrismaPaymentsRepository } from './infrastructure/repositories/prisma-payments.repository';
import { PaymentsController } from './presentation/controllers/payments.controller';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [
    ListPaymentsUseCase,
    RegisterPaymentUseCase,
    ReopenInstallmentUseCase,
    {
      provide: PaymentsRepository,
      useClass: PrismaPaymentsRepository,
    },
  ],
})
export class PaymentsModule {}
