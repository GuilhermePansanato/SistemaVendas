import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePlatformCompanyStatusDto } from '../dto/update-platform-company-status.dto';
import { PlatformCompaniesRepository } from '../../domain/repositories/platform-companies.repository';

@Injectable()
export class UpdatePlatformCompanyStatusUseCase {
  constructor(
    private readonly platformCompaniesRepository: PlatformCompaniesRepository,
  ) {}

  async execute(companyId: string, input: UpdatePlatformCompanyStatusDto) {
    const company = await this.platformCompaniesRepository.updateStatus(
      companyId,
      input.isActive,
    );

    if (!company) {
      throw new NotFoundException('Empresa nao encontrada.');
    }

    return company;
  }
}
