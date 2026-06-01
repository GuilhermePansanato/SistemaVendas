import { Module } from '@nestjs/common';
import { PlatformAuthModule } from '../platform-auth/platform-auth.module';
import { ListPlatformModulesUseCase } from './application/use-cases/list-platform-modules.use-case';
import { PlatformModulesRepository } from './domain/repositories/platform-modules.repository';
import { PrismaPlatformModulesRepository } from './infrastructure/repositories/prisma-platform-modules.repository';
import { PlatformModulesController } from './presentation/controllers/platform-modules.controller';

@Module({
  imports: [PlatformAuthModule],
  controllers: [PlatformModulesController],
  providers: [
    ListPlatformModulesUseCase,
    {
      provide: PlatformModulesRepository,
      useClass: PrismaPlatformModulesRepository,
    },
  ],
  exports: [PlatformModulesRepository],
})
export class PlatformModulesModule {}
