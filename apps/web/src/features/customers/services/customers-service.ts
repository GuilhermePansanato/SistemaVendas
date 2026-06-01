import { apiClient } from '../../../shared/services/api-client';
import type {
  Customer,
  CustomerFilters,
  CustomerFormInput,
} from '../types/customer';

export async function getCustomers(filters: CustomerFilters) {
  const response = await apiClient.get<Customer[]>('/customers', {
    params: {
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
    },
  });

  return response.data;
}

export async function createCustomer(input: CustomerFormInput) {
  const response = await apiClient.post<Customer>('/customers', input);
  return response.data;
}

export async function updateCustomer(customerId: string, input: CustomerFormInput) {
  const response = await apiClient.patch<Customer>(`/customers/${customerId}`, input);
  return response.data;
}
