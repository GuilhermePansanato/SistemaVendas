import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  AuthTokenIssuer,
  AuthTokenPayload,
} from '../../domain/services/auth-token-issuer';

@Injectable()
export class JwtTokenIssuer implements AuthTokenIssuer {
  constructor(private readonly jwtService: JwtService) {}

  issueAccessToken(payload: AuthTokenPayload) {
    return this.jwtService.signAsync(payload);
  }
}
