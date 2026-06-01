import { PlatformAuthUser } from '../entities/platform-auth-user';

export abstract class PlatformAuthUsersRepository {
  abstract findByEmail(email: string): Promise<PlatformAuthUser | null>;
  abstract findById(id: string): Promise<PlatformAuthUser | null>;
}
