import { Injectable } from '@nestjs/common';
import {
  ListSalesFilters,
  SalesRepository,
} from '../../domain/repositories/sales.repository';

@Injectable()
export class ListSalesUseCase {
  constructor(private readonly salesRepository: SalesRepository) {}

  execute(companyId: string, filters: Omit<ListSalesFilters, 'companyId'>) {
    return this.salesRepository.list({
      companyId,
      ...filters,
    });
  }
}
