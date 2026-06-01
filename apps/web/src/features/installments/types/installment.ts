import type { InstallmentStatus, SaleStatus } from '../../../shared/types/finance';

export interface InstallmentCustomerSummary {
  id: string;
  name: string;
  whatsappPhone: string;
}

export interface InstallmentSaleSummary {
  id: string;
  description: string | null;
  saleDate: string;
  totalAmount: number;
  installmentCount: number;
  status: SaleStatus;
}

export interface InstallmentListItem {
  id: string;
  saleId: string;
  customerId: string;
  number: number;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paidAt: string | null;
  status: InstallmentStatus;
  customer: InstallmentCustomerSummary;
  sale: InstallmentSaleSummary;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentDetail extends InstallmentListItem {
  saleNotes: string | null;
}

export interface InstallmentFilters {
  search?: string;
  customerId?: string;
  saleId?: string;
  status?: InstallmentStatus;
  dueFrom?: string;
  dueTo?: string;
}
