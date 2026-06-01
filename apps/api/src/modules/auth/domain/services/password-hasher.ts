export abstract class PasswordHasher {
  abstract compare(plainText: string, hash: string): Promise<boolean>;
}
