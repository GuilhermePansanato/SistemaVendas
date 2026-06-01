import { Injectable } from '@nestjs/common';
import {
  InstallmentsRepository,
  ListInstallmentsFilters,
} from '../../domain/repositories/installments.repository';

@Injectable()
export class ListInstallmentsUseCase {
  constructor(
    private readonly installmentsRepository: InstallmentsRepository,
  ) {}

  execute(
    companyId: string,
    filters: Omit<ListInstallmentsFilters, 'companyId'>,
  ) {
    return this.installmentsRepository.list({
      companyId,
      ...filters,
    });
  }
}
