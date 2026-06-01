import { Injectable } from '@nestjs/common';
import { compare } from 'bcrypt';
import { PasswordHasher } from '../../domain/services/password-hasher';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  compare(plainText: string, hash: string) {
    return compare(plainText, hash);
  }
}
