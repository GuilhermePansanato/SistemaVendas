import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PlatformJwtUser } from '../../presentation/http/platform-jwt-user';
import { PlatformJwtPayload } from './platform-jwt-payload';

@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(
  Strategy,
  'platform-jwt',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: PlatformJwtPayload): PlatformJwtUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      scope: payload.scope,
    };
  }
}
