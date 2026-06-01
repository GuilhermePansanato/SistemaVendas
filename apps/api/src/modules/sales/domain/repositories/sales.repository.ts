import type { SaleLifecycleStatus } from '../../../../shared/domain/finance/status-resolution';
import type { SaleDetail, SaleListItem } from '../entities/sale';

export interface ListSalesFilters {
  companyId?: string;
  search?: string;
  customerId?: string;
  status?: SaleLifecycleStatus;
}

export type ImmediatePaymentMethod =
  | 'CASH'
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'OTHER';

export interface CreateSaleInstallmentData {
  number: number;
  amount: number;
  dueDate: Date;
}

export interface CreateSaleImmediatePaymentData {
  method: ImmediatePaymentMethod;
  reference: string | null;
  notes: string | null;
}

export interface CreateSaleData {
  companyId: string;
  customerId: string;
  description: string | null;
  totalAmount: number;
  installmentCount: number;
  saleDate: Date;
  notes: string | null;
  installments: CreateSaleInstallmentData[];
  immediatePayment?: CreateSaleImmediatePaymentData | null;
}

export abstract class SalesRepository {
  abstract list(filters: ListSalesFilters): Promise<SaleListItem[]>;
  abstract findById(id: string, companyId?: string): Promise<SaleDetail | null>;
  abstract create(data: CreateSaleData): Promise<SaleDetail>;
}
