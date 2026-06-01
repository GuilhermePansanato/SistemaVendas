import { PlatformUserRole } from '@prisma/client';

export interface PlatformAuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: PlatformUserRole;
  isActive: boolean;
}
