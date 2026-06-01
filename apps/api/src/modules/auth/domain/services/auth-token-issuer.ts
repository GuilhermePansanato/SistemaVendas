import { UserRole } from '@prisma/client';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  companyId: string;
}

export abstract class AuthTokenIssuer {
  abstract issueAccessToken(payload: AuthTokenPayload): Promise<string>;
}
