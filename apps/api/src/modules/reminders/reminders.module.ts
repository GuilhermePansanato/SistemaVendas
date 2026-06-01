import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { GetReminderSettingsUseCase } from './application/use-cases/get-reminder-settings.use-case';
import { GetReminderSummaryUseCase } from './application/use-cases/get-reminder-summary.use-case';
import { ListRemindersUseCase } from './application/use-cases/list-reminders.use-case';
import { ProcessDueRemindersUseCase } from './application/use-cases/process-due-reminders.use-case';
import { UpdateReminderSettingsUseCase } from './application/use-cases/update-reminder-settings.use-case';
import { RemindersRepository } from './domain/repositories/reminders.repository';
import { RemindersAutomationProcessor } from './infrastructure/queues/reminders-automation.processor';
import { REMINDERS_AUTOMATION_QUEUE } from './infrastructure/queues/reminders-automation.constants';
import { RemindersAutomationScheduler } from './infrastructure/queues/reminders-automation.scheduler';
import { PrismaRemindersRepository } from './infrastructure/repositories/prisma-reminders.repository';
import { RemindersController } from './presentation/controllers/reminders.controller';

@Module({
  imports: [
    WhatsappModule,
    BullModule.registerQueue({
      name: REMINDERS_AUTOMATION_QUEUE,
    }),
  ],
  controllers: [RemindersController],
  providers: [
    ListRemindersUseCase,
    GetReminderSettingsUseCase,
    UpdateReminderSettingsUseCase,
    GetReminderSummaryUseCase,
    ProcessDueRemindersUseCase,
    RemindersAutomationScheduler,
    RemindersAutomationProcessor,
    {
      provide: RemindersRepository,
      useClass: PrismaRemindersRepository,
    },
  ],
})
export class RemindersModule {}
