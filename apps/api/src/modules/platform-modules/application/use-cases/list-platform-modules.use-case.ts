import { Injectable } from '@nestjs/common';
import { PlatformModulesRepository } from '../../domain/repositories/platform-modules.repository';

@Injectable()
export class ListPlatformModulesUseCase {
  constructor(
    private readonly platformModulesRepository: PlatformModulesRepository,
  ) {}

  async execute() {
    await this.platformModulesRepository.ensureCatalogSeeded();
    return this.platformModulesRepository.listTenantModules();
  }
}
