import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { SystemModuleKey } from '@prisma/client';
import { JwtAuthGuard } from '../../../auth/infrastructure/security/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/http/current-user.decorator';
import type { JwtUser } from '../../../auth/presentation/http/jwt-user';
import { RequireSystemModule } from '../../../../shared/security/require-system-module.decorator';
import { TenantModuleAccessGuard } from '../../../../shared/security/tenant-module-access.guard';
import { ProcessDueRemindersDto } from '../../application/dto/process-due-reminders.dto';
import { UpdateReminderSettingsDto } from '../../application/dto/update-reminder-settings.dto';
import { GetReminderSettingsUseCase } from '../../application/use-cases/get-reminder-settings.use-case';
import { GetReminderSummaryUseCase } from '../../application/use-cases/get-reminder-summary.use-case';
import { ListRemindersUseCase } from '../../application/use-cases/list-reminders.use-case';
import { ProcessDueRemindersUseCase } from '../../application/use-cases/process-due-reminders.use-case';
import { UpdateReminderSettingsUseCase } from '../../application/use-cases/update-reminder-settings.use-case';

@Controller('reminders')
@UseGuards(JwtAuthGuard, TenantModuleAccessGuard)
@RequireSystemModule(SystemModuleKey.REMINDERS)
export class RemindersController {
  constructor(
    private readonly listRemindersUseCase: ListRemindersUseCase,
    private readonly getReminderSettingsUseCase: GetReminderSettingsUseCase,
    private readonly updateReminderSettingsUseCase: UpdateReminderSettingsUseCase,
    private readonly getReminderSummaryUseCase: GetReminderSummaryUseCase,
    private readonly processDueRemindersUseCase: ProcessDueRemindersUseCase,
  ) {}

  @Get()
  list(@CurrentUser() currentUser: JwtUser) {
    return this.listRemindersUseCase.execute(currentUser.companyId);
  }

  @Get('settings')
  settings(@CurrentUser() currentUser: JwtUser) {
    return this.getReminderSettingsUseCase.execute(currentUser.companyId);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() currentUser: JwtUser,
    @Body() input: UpdateReminderSettingsDto,
  ) {
    return this.updateReminderSettingsUseCase.execute(
      currentUser.companyId,
      input,
    );
  }

  @Get('summary')
  summary(@CurrentUser() currentUser: JwtUser) {
    return this.getReminderSummaryUseCase.execute(currentUser.companyId);
  }

  @Post('process')
  process(
    @CurrentUser() currentUser: JwtUser,
    @Body() input?: ProcessDueRemindersDto,
  ) {
    return this.processDueRemindersUseCase.execute(
      currentUser.companyId,
      input?.referenceDate,
    );
  }
}
