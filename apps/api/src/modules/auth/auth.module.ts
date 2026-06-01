import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { GetAuthProfileUseCase } from './application/use-cases/get-auth-profile.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { AuthUsersRepository } from './domain/repositories/auth-users.repository';
import { AuthTokenIssuer } from './domain/services/auth-token-issuer';
import { PasswordHasher } from './domain/services/password-hasher';
import { PrismaAuthUsersRepository } from './infrastructure/repositories/prisma-auth-users.repository';
import { BcryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { JwtStrategy } from './infrastructure/security/jwt-strategy';
import { JwtTokenIssuer } from './infrastructure/security/jwt-token-issuer';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ??
            '1d') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    GetAuthProfileUseCase,
    JwtStrategy,
    {
      provide: AuthUsersRepository,
      useClass: PrismaAuthUsersRepository,
    },
    {
      provide: PasswordHasher,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: AuthTokenIssuer,
      useClass: JwtTokenIssuer,
    },
  ],
  exports: [PassportModule, JwtModule, AuthUsersRepository, PasswordHasher],
})
export class AuthModule {}
