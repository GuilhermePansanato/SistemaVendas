import { Module } from '@nestjs/common';
import { GetInstallmentByIdUseCase } from './application/use-cases/get-installment-by-id.use-case';
import { ListInstallmentsUseCase } from './application/use-cases/list-installments.use-case';
import { InstallmentsRepository } from './domain/repositories/installments.repository';
import { PrismaInstallmentsRepository } from './infrastructure/repositories/prisma-installments.repository';
import { InstallmentsController } from './presentation/controllers/installments.controller';

@Module({
  controllers: [InstallmentsController],
  providers: [
    ListInstallmentsUseCase,
    GetInstallmentByIdUseCase,
    {
      provide: InstallmentsRepository,
      useClass: PrismaInstallmentsRepository,
    },
  ],
})
export class InstallmentsModule {}
