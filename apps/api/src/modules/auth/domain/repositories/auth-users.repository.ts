import { AuthUser } from '../entities/auth-user';

export abstract class AuthUsersRepository {
  abstract findByEmail(email: string): Promise<AuthUser | null>;
  abstract findById(id: string): Promise<AuthUser | null>;
}
