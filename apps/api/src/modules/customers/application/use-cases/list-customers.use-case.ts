import { Injectable } from '@nestjs/common';
import {
  CustomersRepository,
  ListCustomersFilters,
} from '../../domain/repositories/customers.repository';

@Injectable()
export class ListCustomersUseCase {
  constructor(private readonly customersRepository: CustomersRepository) {}

  execute(companyId: string, filters: Omit<ListCustomersFilters, 'companyId'>) {
    return this.customersRepository.list({
      companyId,
      ...filters,
    });
  }
}
