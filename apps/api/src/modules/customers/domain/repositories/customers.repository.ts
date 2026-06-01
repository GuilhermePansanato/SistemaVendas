import { Customer } from '../entities/customer';

export interface ListCustomersFilters {
  companyId?: string;
  search?: string;
  isActive?: boolean;
}

export interface CreateCustomerData {
  companyId: string;
  name: string;
  document: string | null;
  phone: string;
  whatsappPhone: string;
  email: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface UpdateCustomerData {
  name?: string;
  document?: string | null;
  phone?: string;
  whatsappPhone?: string;
  email?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export abstract class CustomersRepository {
  abstract list(filters: ListCustomersFilters): Promise<Customer[]>;
  abstract findById(id: string, companyId?: string): Promise<Customer | null>;
  abstract create(data: CreateCustomerData): Promise<Customer>;
  abstract update(
    id: string,
    companyId: string,
    data: UpdateCustomerData,
  ): Promise<Customer>;
}
