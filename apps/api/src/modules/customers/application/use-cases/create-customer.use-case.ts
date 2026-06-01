import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CustomersRepository } from '../../domain/repositories/customers.repository';

@Injectable()
export class CreateCustomerUseCase {
  constructor(private readonly customersRepository: CustomersRepository) {}

  execute(companyId: string, input: CreateCustomerDto) {
    return this.customersRepository.create({
      companyId,
      name: input.name,
      document: input.document ?? null,
      phone: input.phone,
      whatsappPhone: input.whatsappPhone,
      email: input.email ?? null,
      notes: input.notes ?? null,
      isActive: input.isActive ?? true,
    });
  }
}
