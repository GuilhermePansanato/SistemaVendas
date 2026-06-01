import { Injectable } from '@nestjs/common';
import {
  ListPaymentsFilters,
  PaymentsRepository,
} from '../../domain/repositories/payments.repository';

@Injectable()
export class ListPaymentsUseCase {
  constructor(private readonly paymentsRepository: PaymentsRepository) {}

  execute(companyId: string, filters: Omit<ListPaymentsFilters, 'companyId'>) {
    return this.paymentsRepository.list({
      companyId,
      ...filters,
    });
  }
}
