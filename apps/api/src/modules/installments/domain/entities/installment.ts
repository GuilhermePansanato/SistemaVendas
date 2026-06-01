import type {
  InstallmentLifecycleStatus,
  SaleLifecycleStatus,
} from '../../../../shared/domain/finance/status-resolution';

export interface InstallmentCustomerSummary {
  id: string;
  name: string;
  whatsappPhone: string;
}

export interface InstallmentSaleSummary {
  id: string;
  description: string | null;
  saleDate: Date;
  totalAmount: number;
  installmentCount: number;
  status: SaleLifecycleStatus;
}

export interface InstallmentListItem {
  id: string;
  saleId: string;
  customerId: string;
  number: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: InstallmentLifecycleStatus;
  customer: InstallmentCustomerSummary;
  sale: InstallmentSaleSummary;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstallmentDetail extends InstallmentListItem {
  saleNotes: string | null;
}
