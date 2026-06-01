import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthUsersRepository } from '../../domain/repositories/auth-users.repository';

@Injectable()
export class GetAuthProfileUseCase {
  constructor(private readonly authUsersRepository: AuthUsersRepository) {}

  async execute(userId: string) {
    const user = await this.authUsersRepository.findById(userId);

    if (!user || !user.isActive || !user.companyIsActive) {
      throw new UnauthorizedException('Usuario nao encontrado.');
    }

    return {
      id: user.id,
      companyId: user.companyId,
      companyName: user.companyName,
      modules: user.modules,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
