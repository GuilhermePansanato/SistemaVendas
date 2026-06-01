import { Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { ResetPlatformCompanyUserPasswordDto } from '../dto/reset-platform-company-user-password.dto';
import { PlatformCompaniesRepository } from '../../domain/repositories/platform-companies.repository';

@Injectable()
export class ResetPlatformCompanyUserPasswordUseCase {
  constructor(
    private readonly platformCompaniesRepository: PlatformCompaniesRepository,
  ) {}

  async execute(
    companyId: string,
    userId: string,
    input: ResetPlatformCompanyUserPasswordDto,
  ) {
    const passwordHash = await hash(input.newPassword, 10);
    const passwordUpdated =
      await this.platformCompaniesRepository.updateUserPassword(
        companyId,
        userId,
        passwordHash,
      );

    if (!passwordUpdated) {
      throw new NotFoundException('Usuario da empresa nao encontrado.');
    }

    return {
      success: true,
      message: 'Senha atualizada com sucesso.',
    };
  }
}
