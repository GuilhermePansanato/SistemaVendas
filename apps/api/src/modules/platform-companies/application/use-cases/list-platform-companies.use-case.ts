import { Injectable } from '@nestjs/common';
import { PlatformModulesRepository } from '../../../platform-modules/domain/repositories/platform-modules.repository';
import { PlatformCompaniesRepository } from '../../domain/repositories/platform-companies.repository';

@Injectable()
export class ListPlatformCompaniesUseCase {
  constructor(
    private readonly platformCompaniesRepository: PlatformCompaniesRepository,
    private readonly platformModulesRepository: PlatformModulesRepository,
  ) {}

  async execute() {
    await this.platformModulesRepository.ensureCatalogSeeded();
    return this.platformCompaniesRepository.list();
  }
}
