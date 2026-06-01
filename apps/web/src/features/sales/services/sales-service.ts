import { apiClient } from '../../../shared/services/api-client';
import type {
  CreateSaleInput,
  SaleDetail,
  SaleFilters,
  SaleListItem,
} from '../types/sale';

export async function getSales(filters: SaleFilters) {
  const response = await apiClient.get<SaleListItem[]>('/sales', {
    params: {
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    },
  });

  return response.data;
}

export async function getSaleById(saleId: string) {
  const response = await apiClient.get<SaleDetail>(`/sales/${saleId}`);
  return response.data;
}

export async function createSale(input: CreateSaleInput) {
  const response = await apiClient.post<SaleDetail>('/sales', input);
  return response.data;
}
