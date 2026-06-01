import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordHasher } from '../../../auth/domain/services/password-hasher';
import { PlatformAuthUsersRepository } from '../../domain/repositories/platform-auth-users.repository';
import { PlatformAuthTokenIssuer } from '../../domain/services/platform-auth-token-issuer';
import { PlatformLoginDto } from '../dto/platform-login.dto';

@Injectable()
export class PlatformLoginUseCase {
  constructor(
    private readonly platformAuthUsersRepository: PlatformAuthUsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly platformAuthTokenIssuer: PlatformAuthTokenIssuer,
  ) {}

  async execute(input: PlatformLoginDto) {
    const user = await this.platformAuthUsersRepository.findByEmail(
      input.email,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const accessToken = await this.platformAuthTokenIssuer.issueAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      scope: 'platform',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
