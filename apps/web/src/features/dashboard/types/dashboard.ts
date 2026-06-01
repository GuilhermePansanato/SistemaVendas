import type {
  InstallmentStatus,
  PaymentMethod,
} from '../../../shared/types/finance';

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
  dueDate: string;
  remainingAmount: number;
  status: InstallmentStatus;
}

export interface DashboardPaymentPreview {
  paymentId: string;
  installmentId: string;
  saleId: string;
  customerId: string;
  customerName: string;
  saleDescription: string | null;
  amount: number;
  paidAt: string;
  method: PaymentMethod;
}

export interface DashboardSummary {
  generatedAt: string;
  upcomingWindowDays: number;
  totals: DashboardTotals;
  saleStatusBreakdown: DashboardSaleStatusBreakdown;
  upcomingInstallments: DashboardInstallmentPreview[];
  overdueInstallments: DashboardInstallmentPreview[];
  recentPayments: DashboardPaymentPreview[];
}
