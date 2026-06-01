import { apiClient } from '../../../shared/services/api-client';
import type {
  CreatePaymentInput,
  PaymentFilters,
  PaymentListItem,
  ReopenInstallmentInput,
} from '../types/payment';

export async function getPayments(filters: PaymentFilters) {
  const response = await apiClient.get<PaymentListItem[]>('/payments', {
    params: {
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.installmentId ? { installmentId: filters.installmentId } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.method ? { method: filters.method } : {}),
      ...(filters.paidFrom ? { paidFrom: filters.paidFrom } : {}),
      ...(filters.paidTo ? { paidTo: filters.paidTo } : {}),
    },
  });

  return response.data;
}

export async function registerPayment(
  installmentId: string,
  input: CreatePaymentInput,
) {
  const response = await apiClient.post<PaymentListItem>(
    `/installments/${installmentId}/payments`,
    input,
  );

  return response.data;
}

export async function reopenInstallment(
  installmentId: string,
  input: ReopenInstallmentInput,
) {
  await apiClient.post(`/installments/${installmentId}/reopen`, input);
}
