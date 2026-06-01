import type { InstallmentLifecycleStatus } from '../../../../shared/domain/finance/status-resolution';
import type {
  InstallmentDetail,
  InstallmentListItem,
} from '../entities/installment';

export interface ListInstallmentsFilters {
  companyId?: string;
  search?: string;
  customerId?: string;
  saleId?: string;
  status?: InstallmentLifecycleStatus;
  dueFrom?: Date;
  dueTo?: Date;
}

export abstract class InstallmentsRepository {
  abstract list(
    filters: ListInstallmentsFilters,
  ): Promise<InstallmentListItem[]>;
  abstract findById(
    id: string,
    companyId?: string,
  ): Promise<InstallmentDetail | null>;
}
