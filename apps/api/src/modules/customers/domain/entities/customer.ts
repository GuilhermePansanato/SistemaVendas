export interface Customer {
  id: string;
  companyId: string;
  name: string;
  document: string | null;
  phone: string;
  whatsappPhone: string;
  email: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
