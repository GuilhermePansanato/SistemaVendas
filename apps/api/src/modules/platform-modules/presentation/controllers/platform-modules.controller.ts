import { Controller, Get, UseGuards } from '@nestjs/common';
import { PlatformJwtAuthGuard } from '../../../platform-auth/infrastructure/security/platform-jwt-auth.guard';
import { ListPlatformModulesUseCase } from '../../application/use-cases/list-platform-modules.use-case';

@Controller('platform/modules')
@UseGuards(PlatformJwtAuthGuard)
export class PlatformModulesController {
  constructor(
    private readonly listPlatformModulesUseCase: ListPlatformModulesUseCase,
  ) {}

  @Get()
  list() {
    return this.listPlatformModulesUseCase.execute();
  }
}
