import type {
  InstallmentLifecycleStatus,
  SaleLifecycleStatus,
} from '../../../../shared/domain/finance/status-resolution';

export type PaymentMethodType =
  | 'CASH'
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'OTHER';

export interface PaymentCustomerSummary {
  id: string;
  name: string;
  whatsappPhone: string;
}

export interface PaymentSaleSummary {
  id: string;
  description: string | null;
  saleDate: Date;
  status: SaleLifecycleStatus;
}

export interface PaymentInstallmentSummary {
  id: string;
  number: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: InstallmentLifecycleStatus;
}

export interface PaymentListItem {
  id: string;
  installmentId: string;
  saleId: string;
  customerId: string;
  amount: number;
  paidAt: Date;
  method: PaymentMethodType;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
  customer: PaymentCustomerSummary;
  sale: PaymentSaleSummary;
  installment: PaymentInstallmentSummary;
}

export interface PaymentTargetInstallment {
  id: string;
  saleId: string;
  amount: number;
  paidAmount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: InstallmentLifecycleStatus;
}
