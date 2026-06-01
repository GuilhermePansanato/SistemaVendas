import { PlatformUserRole } from '@prisma/client';

export interface PlatformJwtUser {
  userId: string;
  email: string;
  role: PlatformUserRole;
  scope: 'platform';
}
