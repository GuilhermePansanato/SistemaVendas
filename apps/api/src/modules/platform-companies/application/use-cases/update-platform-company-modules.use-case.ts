import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PlatformModulesRepository } from '../../../platform-modules/domain/repositories/platform-modules.repository';
import { UpdatePlatformCompanyModulesDto } from '../dto/update-platform-company-modules.dto';
import { PlatformCompaniesRepository } from '../../domain/repositories/platform-companies.repository';

@Injectable()
export class UpdatePlatformCompanyModulesUseCase {
  constructor(
    private readonly platformCompaniesRepository: PlatformCompaniesRepository,
    private readonly platformModulesRepository: PlatformModulesRepository,
  ) {}

  async execute(companyId: string, input: UpdatePlatformCompanyModulesDto) {
    await this.platformModulesRepository.ensureCatalogSeeded();

    const availableModules = await this.platformModulesRepository.listByKeys(
      input.moduleKeys,
    );

    if (availableModules.length !== input.moduleKeys.length) {
      throw new BadRequestException(
        'Um ou mais modulos informados nao estao disponiveis para contratacao.',
      );
    }

    const company = await this.platformCompaniesRepository.updateModules(
      companyId,
      input.moduleKeys,
    );

    if (!company) {
      throw new NotFoundException('Empresa nao encontrada.');
    }

    return company;
  }
}
