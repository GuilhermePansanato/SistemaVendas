import { PlatformUserRole } from '@prisma/client';

export interface PlatformJwtPayload {
  sub: string;
  email: string;
  role: PlatformUserRole;
  scope: 'platform';
}
