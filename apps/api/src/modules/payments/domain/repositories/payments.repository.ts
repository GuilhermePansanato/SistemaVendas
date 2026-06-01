import type {
  PaymentListItem,
  PaymentMethodType,
  PaymentTargetInstallment,
} from '../entities/payment';

export interface RegisterPaymentData {
  companyId: string;
  installmentId: string;
  amount: number;
  paidAt: Date;
  method: PaymentMethodType;
  reference: string | null;
  notes: string | null;
}

export interface ListPaymentsFilters {
  companyId?: string;
  search?: string;
  installmentId?: string;
  customerId?: string;
  method?: PaymentMethodType;
  paidFrom?: Date;
  paidTo?: Date;
}

export interface ReopenInstallmentData {
  companyId: string;
  installmentId: string;
  reversedByUserId: string;
  reversalReason: string | null;
}

export abstract class PaymentsRepository {
  abstract findInstallmentForPayment(
    companyId: string,
    installmentId: string,
  ): Promise<PaymentTargetInstallment | null>;
  abstract register(data: RegisterPaymentData): Promise<PaymentListItem>;
  abstract list(filters: ListPaymentsFilters): Promise<PaymentListItem[]>;
  abstract reopenInstallment(data: ReopenInstallmentData): Promise<void>;
}
