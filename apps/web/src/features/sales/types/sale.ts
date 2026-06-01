import type {
  InstallmentStatus,
  PaymentMethod,
  SaleStatus,
} from '../../../shared/types/finance';

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
  dueDate: string;
  paidAt: string | null;
  status: InstallmentStatus;
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
  saleDate: string;
  status: SaleStatus;
  customer: SaleCustomerSummary;
  financial: SaleFinancialSummary;
  counts: SaleInstallmentCounts;
  nextDueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaleDetail extends SaleListItem {
  notes: string | null;
  installments: SaleInstallmentSummary[];
}

export interface SaleFilters {
  search?: string;
  customerId?: string;
  status?: SaleStatus;
}

export interface CreateSaleInput {
  customerId: string;
  description?: string | null;
  totalAmount: number;
  saleDate: string;
  notes?: string | null;
  installments: Array<{
    dueDate: string;
  }>;
  payment?: {
    method: PaymentMethod;
    reference?: string | null;
    notes?: string | null;
  };
}
