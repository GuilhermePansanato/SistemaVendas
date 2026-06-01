import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  companyId: string;
  companyName: string;
  companyIsActive: boolean;
  modules: string[];
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}
