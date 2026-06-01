import type {
  InstallmentLifecycleStatus,
  SaleLifecycleStatus,
} from '../../../../shared/domain/finance/status-resolution';
import type { PaymentMethodType } from '../../../payments/domain/entities/payment';

export interface DashboardTotals {
  openAmount: number;
  overdueAmount: number;
  receivedInRange: number;
  receivedThisMonth: number;
  receivedToday: number;
  salesInRange: number;
  totalCustomers: number;
  activeCustomers: number;
  openInstallments: number;
  overdueInstallments: number;
  paidInstallments: number;
}

export interface DashboardSaleStatusBreakdown {
  open: number;
  partiallyPaid: number;
  paid: number;
  overdue: number;
}

export interface DashboardInstallmentPreview {
  installmentId: string;
  saleId: string;
  customerId: string;
  customerName: string;
  whatsappPhone: string;
  saleDescription: string | null;
  installmentNumber: number;
  dueDate: Date;
  remainingAmount: number;
  status: InstallmentLifecycleStatus;
}

export interface DashboardPaymentPreview {
  paymentId: string;
  installmentId: string;
  saleId: string;
  customerId: string;
  customerName: string;
  saleDescription: string | null;
  amount: number;
  paidAt: Date;
  method: PaymentMethodType;
}

export interface DashboardSummary {
  generatedAt: Date;
  upcomingWindowDays: number;
  totals: DashboardTotals;
  saleStatusBreakdown: DashboardSaleStatusBreakdown;
  upcomingInstallments: DashboardInstallmentPreview[];
  overdueInstallments: DashboardInstallmentPreview[];
  recentPayments: DashboardPaymentPreview[];
}

export interface DashboardSaleSnapshot {
  saleId: string;
  customerId: string;
  customerName: string;
  whatsappPhone: string;
  description: string | null;
  status: SaleLifecycleStatus;
  installments: Array<{
    installmentId: string;
    number: number;
    dueDate: Date;
    amount: number;
    paidAmount: number;
    remainingAmount: number;
    status: InstallmentLifecycleStatus;
  }>;
}
