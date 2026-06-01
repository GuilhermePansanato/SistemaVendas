import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { CreateSaleUseCase } from './application/use-cases/create-sale.use-case';
import { GetSaleByIdUseCase } from './application/use-cases/get-sale-by-id.use-case';
import { ListSalesUseCase } from './application/use-cases/list-sales.use-case';
import { SalesRepository } from './domain/repositories/sales.repository';
import { PrismaSalesRepository } from './infrastructure/repositories/prisma-sales.repository';
import { SalesController } from './presentation/controllers/sales.controller';

@Module({
  imports: [CustomersModule],
  controllers: [SalesController],
  providers: [
    ListSalesUseCase,
    GetSaleByIdUseCase,
    CreateSaleUseCase,
    {
      provide: SalesRepository,
      useClass: PrismaSalesRepository,
    },
  ],
})
export class SalesModule {}
