import { Module } from '@nestjs/common';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { GetCustomerByIdUseCase } from './application/use-cases/get-customer-by-id.use-case';
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case';
import { UpdateCustomerUseCase } from './application/use-cases/update-customer.use-case';
import { CustomersRepository } from './domain/repositories/customers.repository';
import { PrismaCustomersRepository } from './infrastructure/repositories/prisma-customers.repository';
import { CustomersController } from './presentation/controllers/customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [
    ListCustomersUseCase,
    GetCustomerByIdUseCase,
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    {
      provide: CustomersRepository,
      useClass: PrismaCustomersRepository,
    },
  ],
  exports: [CustomersRepository],
})
export class CustomersModule {}
