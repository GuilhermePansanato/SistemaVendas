import { PlatformUserRole } from '@prisma/client';

export interface PlatformAuthTokenPayload {
  sub: string;
  email: string;
  role: PlatformUserRole;
  scope: 'platform';
}

export abstract class PlatformAuthTokenIssuer {
  abstract issueAccessToken(payload: PlatformAuthTokenPayload): Promise<string>;
}
