import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthUsersRepository } from '../../domain/repositories/auth-users.repository';
import { AuthTokenIssuer } from '../../domain/services/auth-token-issuer';
import { PasswordHasher } from '../../domain/services/password-hasher';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authUsersRepository: AuthUsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly authTokenIssuer: AuthTokenIssuer,
  ) {}

  async execute(input: LoginDto) {
    const user = await this.authUsersRepository.findByEmail(input.email);

    if (!user || !user.isActive || !user.companyIsActive) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const accessToken = await this.authTokenIssuer.issueAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        companyId: user.companyId,
        companyName: user.companyName,
        modules: user.modules,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
