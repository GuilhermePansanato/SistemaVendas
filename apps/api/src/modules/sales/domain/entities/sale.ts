import type {
  InstallmentLifecycleStatus,
  SaleLifecycleStatus,
} from '../../../../shared/domain/finance/status-resolution';

export interface SaleCustomerSummary {
  id: string;
  name: string;
  whatsappPhone: string;
}

export interface SaleInstallmentSummary {
  id: string;
  number: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: InstallmentLifecycleStatus;
}

export interface SaleFinancialSummary {
  paidAmount: number;
  remainingAmount: number;
}

export interface SaleInstallmentCounts {
  pending: number;
  partiallyPaid: number;
  paid: number;
  overdue: number;
}

export interface SaleListItem {
  id: string;
  customerId: string;
  description: string | null;
  totalAmount: number;
  installmentCount: number;
  saleDate: Date;
  status: SaleLifecycleStatus;
  customer: SaleCustomerSummary;
  financial: SaleFinancialSummary;
  counts: SaleInstallmentCounts;
  nextDueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleDetail extends SaleListItem {
  notes: string | null;
  installments: SaleInstallmentSummary[];
}
