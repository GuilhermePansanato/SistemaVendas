export interface Customer {
  id: string;
  name: string;
  document: string | null;
  phone: string;
  whatsappPhone: string;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFilters {
  search?: string;
  isActive?: boolean;
}

export interface CustomerFormInput {
  name: string;
  phone: string;
  whatsappPhone: string;
  document?: string | null;
  email?: string | null;
  notes?: string | null;
  isActive: boolean;
}
