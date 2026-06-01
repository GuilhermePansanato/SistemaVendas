import { Global, Module } from '@nestjs/common';
import { TenantModuleAccessGuard } from './tenant-module-access.guard';

@Global()
@Module({
  providers: [TenantModuleAccessGuard],
  exports: [TenantModuleAccessGuard],
})
export class TenantModuleAccessModule {}
