import { apiClient } from '../../../shared/services/api-client';
import type {
  InstallmentDetail,
  InstallmentFilters,
  InstallmentListItem,
} from '../types/installment';

export async function getInstallments(filters: InstallmentFilters) {
  const response = await apiClient.get<InstallmentListItem[]>('/installments', {
    params: {
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.saleId ? { saleId: filters.saleId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.dueFrom ? { dueFrom: filters.dueFrom } : {}),
      ...(filters.dueTo ? { dueTo: filters.dueTo } : {}),
    },
  });

  return response.data;
}

export async function getInstallmentById(installmentId: string) {
  const response = await apiClient.get<InstallmentDetail>(
    `/installments/${installmentId}`,
  );

  return response.data;
}
