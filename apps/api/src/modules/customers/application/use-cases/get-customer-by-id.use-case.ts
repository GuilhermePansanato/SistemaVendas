import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from '../../domain/repositories/customers.repository';

@Injectable()
export class GetCustomerByIdUseCase {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async execute(companyId: string, customerId: string) {
    const customer = await this.customersRepository.findById(
      customerId,
      companyId,
    );

    if (!customer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }

    return customer;
  }
}
