import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomersRepository } from '../../domain/repositories/customers.repository';
import { UpdateCustomerDto } from '../dto/update-customer.dto';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async execute(
    companyId: string,
    customerId: string,
    input: UpdateCustomerDto,
  ) {
    const existingCustomer = await this.customersRepository.findById(
      customerId,
      companyId,
    );

    if (!existingCustomer) {
      throw new NotFoundException('Cliente nao encontrado.');
    }

    return this.customersRepository.update(customerId, companyId, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.document !== undefined ? { document: input.document } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.whatsappPhone !== undefined
        ? { whatsappPhone: input.whatsappPhone }
        : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  }
}
