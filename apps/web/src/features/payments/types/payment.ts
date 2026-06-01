import type {
  InstallmentStatus,
  PaymentMethod,
  SaleStatus,
} from '../../../shared/types/finance';

export interface PaymentCustomerSummary {
  id: string;
  name: string;
  whatsappPhone: string;
}

export interface PaymentSaleSummary {
  id: string;
  description: string | null;
  saleDate: string;
  status: SaleStatus;
}

export interface PaymentInstallmentSummary {
  id: string;
  number: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paidAt: string | null;
  status: InstallmentStatus;
}

export interface PaymentListItem {
  id: string;
  installmentId: string;
  saleId: string;
  customerId: string;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  createdAt: string;
  customer: PaymentCustomerSummary;
  sale: PaymentSaleSummary;
  installment: PaymentInstallmentSummary;
}

export interface PaymentFilters {
  search?: string;
  installmentId?: string;
  customerId?: string;
  method?: PaymentMethod;
  paidFrom?: string;
  paidTo?: string;
}

export interface CreatePaymentInput {
  amount: number;
  paidAt: string;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}

export interface ReopenInstallmentInput {
  password: string;
}
