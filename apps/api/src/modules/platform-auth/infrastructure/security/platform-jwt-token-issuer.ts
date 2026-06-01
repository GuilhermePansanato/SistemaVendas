import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  PlatformAuthTokenIssuer,
  PlatformAuthTokenPayload,
} from '../../domain/services/platform-auth-token-issuer';

@Injectable()
export class PlatformJwtTokenIssuer implements PlatformAuthTokenIssuer {
  constructor(private readonly jwtService: JwtService) {}

  issueAccessToken(payload: PlatformAuthTokenPayload) {
    return this.jwtService.signAsync(payload);
  }
}
