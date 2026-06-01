import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ProcessDueRemindersUseCase } from '../../application/use-cases/process-due-reminders.use-case';
import { RemindersRepository } from '../../domain/repositories/reminders.repository';
import { shouldRunReminderAutomation } from '../../domain/services/automation-schedule';
import {
  REMINDERS_AUTOMATION_CHECK_JOB,
  REMINDERS_AUTOMATION_QUEUE,
} from './reminders-automation.constants';

@Injectable()
@Processor(REMINDERS_AUTOMATION_QUEUE)
export class RemindersAutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersAutomationProcessor.name);

  constructor(
    private readonly remindersRepository: RemindersRepository,
    private readonly processDueRemindersUseCase: ProcessDueRemindersUseCase,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== REMINDERS_AUTOMATION_CHECK_JOB) {
      return null;
    }

    const now = new Date();
    const timeZone =
      this.configService.get<string>('APP_TIMEZONE')?.trim() ||
      'America/Sao_Paulo';
    const automationTargets =
      await this.remindersRepository.listAutomationTargets();

    const results: Array<{
      companyId: string;
      created: number;
      sent: number;
      failed: number;
      skipped: number;
    }> = [];

    for (const target of automationTargets) {
      if (
        !shouldRunReminderAutomation(
          now,
          target.defaultSendTime,
          target.lastAutomatedRunAt,
          timeZone,
        )
      ) {
        continue;
      }

      const result = await this.processDueRemindersUseCase.execute(
        target.companyId,
        now,
      );
      await this.remindersRepository.markAutomatedRun(target.companyId, now);
      results.push({
        companyId: target.companyId,
        created: result.created,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
      });
    }

    if (results.length === 0) {
      return {
        executed: false,
      };
    }

    const totals = results.reduce(
      (summary, result) => ({
        created: summary.created + result.created,
        sent: summary.sent + result.sent,
        failed: summary.failed + result.failed,
        skipped: summary.skipped + result.skipped,
      }),
      {
        created: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
      },
    );

    this.logger.log(
      `Cobrancas automaticas processadas para ${results.length} empresa(s): criados=${totals.created}, enviados=${totals.sent}, falhas=${totals.failed}, ignorados=${totals.skipped}.`,
    );

    return {
      executed: true,
      companies: results.length,
      ...totals,
      results,
    };
  }
}
