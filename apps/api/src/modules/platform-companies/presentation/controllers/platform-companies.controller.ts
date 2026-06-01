import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PlatformJwtAuthGuard } from '../../../platform-auth/infrastructure/security/platform-jwt-auth.guard';
import { CreatePlatformCompanyDto } from '../../application/dto/create-platform-company.dto';
import { ResetPlatformCompanyUserPasswordDto } from '../../application/dto/reset-platform-company-user-password.dto';
import { UpdatePlatformCompanyModulesDto } from '../../application/dto/update-platform-company-modules.dto';
import { UpdatePlatformCompanyStatusDto } from '../../application/dto/update-platform-company-status.dto';
import { CreatePlatformCompanyUseCase } from '../../application/use-cases/create-platform-company.use-case';
import { ListPlatformCompaniesUseCase } from '../../application/use-cases/list-platform-companies.use-case';
import { ResetPlatformCompanyUserPasswordUseCase } from '../../application/use-cases/reset-platform-company-user-password.use-case';
import { UpdatePlatformCompanyModulesUseCase } from '../../application/use-cases/update-platform-company-modules.use-case';
import { UpdatePlatformCompanyStatusUseCase } from '../../application/use-cases/update-platform-company-status.use-case';

@Controller('platform/companies')
@UseGuards(PlatformJwtAuthGuard)
export class PlatformCompaniesController {
  constructor(
    private readonly listPlatformCompaniesUseCase: ListPlatformCompaniesUseCase,
    private readonly createPlatformCompanyUseCase: CreatePlatformCompanyUseCase,
    private readonly updatePlatformCompanyStatusUseCase: UpdatePlatformCompanyStatusUseCase,
    private readonly updatePlatformCompanyModulesUseCase: UpdatePlatformCompanyModulesUseCase,
    private readonly resetPlatformCompanyUserPasswordUseCase: ResetPlatformCompanyUserPasswordUseCase,
  ) {}

  @Get()
  list() {
    return this.listPlatformCompaniesUseCase.execute();
  }

  @Post()
  create(@Body() input: CreatePlatformCompanyDto) {
    return this.createPlatformCompanyUseCase.execute(input);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') companyId: string,
    @Body() input: UpdatePlatformCompanyStatusDto,
  ) {
    return this.updatePlatformCompanyStatusUseCase.execute(companyId, input);
  }

  @Patch(':id/modules')
  updateModules(
    @Param('id') companyId: string,
    @Body() input: UpdatePlatformCompanyModulesDto,
  ) {
    return this.updatePlatformCompanyModulesUseCase.execute(companyId, input);
  }

  @Patch(':id/users/:userId/password')
  resetUserPassword(
    @Param('id') companyId: string,
    @Param('userId') userId: string,
    @Body() input: ResetPlatformCompanyUserPasswordDto,
  ) {
    return this.resetPlatformCompanyUserPasswordUseCase.execute(
      companyId,
      userId,
      input,
    );
  }
}
