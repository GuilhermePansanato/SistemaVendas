import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PlatformAuthUsersRepository } from '../../domain/repositories/platform-auth-users.repository';

@Injectable()
export class GetPlatformAuthProfileUseCase {
  constructor(
    private readonly platformAuthUsersRepository: PlatformAuthUsersRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.platformAuthUsersRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario master nao encontrado.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
