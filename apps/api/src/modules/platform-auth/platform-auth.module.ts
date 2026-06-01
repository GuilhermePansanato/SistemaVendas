import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { AuthModule } from '../auth/auth.module';
import { GetPlatformAuthProfileUseCase } from './application/use-cases/get-platform-auth-profile.use-case';
import { PlatformLoginUseCase } from './application/use-cases/platform-login.use-case';
import { PlatformAuthUsersRepository } from './domain/repositories/platform-auth-users.repository';
import { PlatformAuthTokenIssuer } from './domain/services/platform-auth-token-issuer';
import { PrismaPlatformAuthUsersRepository } from './infrastructure/repositories/prisma-platform-auth-users.repository';
import { PlatformJwtStrategy } from './infrastructure/security/platform-jwt-strategy';
import { PlatformJwtTokenIssuer } from './infrastructure/security/platform-jwt-token-issuer';
import { PlatformAuthController } from './presentation/controllers/platform-auth.controller';

@Module({
  imports: [
    AuthModule,
    PassportModule.register({
      defaultStrategy: 'platform-jwt',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('PLATFORM_JWT_EXPIRES_IN') ??
            configService.get<string>('JWT_EXPIRES_IN') ??
            '1d') as StringValue,
        },
      }),
    }),
  ],
  controllers: [PlatformAuthController],
  providers: [
    PlatformLoginUseCase,
    GetPlatformAuthProfileUseCase,
    PlatformJwtStrategy,
    {
      provide: PlatformAuthUsersRepository,
      useClass: PrismaPlatformAuthUsersRepository,
    },
    {
      provide: PlatformAuthTokenIssuer,
      useClass: PlatformJwtTokenIssuer,
    },
  ],
  exports: [PassportModule, JwtModule, PlatformAuthUsersRepository],
})
export class PlatformAuthModule {}
