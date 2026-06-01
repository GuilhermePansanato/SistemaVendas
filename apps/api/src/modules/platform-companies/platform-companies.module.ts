import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';
import { PlatformModulesModule } from '../platform-modules/platform-modules.module';
import { CreatePlatformCompanyUseCase } from './application/use-cases/create-platform-company.use-case';
import { ListPlatformCompaniesUseCase } from './application/use-cases/list-platform-companies.use-case';
import { ResetPlatformCompanyUserPasswordUseCase } from './application/use-cases/reset-platform-company-user-password.use-case';
import { UpdatePlatformCompanyModulesUseCase } from './application/use-cases/update-platform-company-modules.use-case';
import { UpdatePlatformCompanyStatusUseCase } from './application/use-cases/update-platform-company-status.use-case';
import { PlatformCompaniesRepository } from './domain/repositories/platform-companies.repository';
import { PrismaPlatformCompaniesRepository } from './infrastructure/repositories/prisma-platform-companies.repository';
import { PlatformCompaniesController } from './presentation/controllers/platform-companies.controller';

@Module({
  imports: [PlatformAuthModule, PlatformModulesModule],
  controllers: [PlatformCompaniesController],
  providers: [
    ListPlatformCompaniesUseCase,
    CreatePlatformCompanyUseCase,
    UpdatePlatformCompanyStatusUseCase,
    UpdatePlatformCompanyModulesUseCase,
    ResetPlatformCompanyUserPasswordUseCase,
    {
      provide: PlatformCompaniesRepository,
      useClass: PrismaPlatformCompaniesRepository,
    },
  ],
})
export class PlatformCompaniesModule {}
