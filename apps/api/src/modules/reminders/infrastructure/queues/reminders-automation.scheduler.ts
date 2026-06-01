import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  REMINDERS_AUTOMATION_CHECK_JOB,
  REMINDERS_AUTOMATION_CHECK_JOB_ID,
  REMINDERS_AUTOMATION_QUEUE,
} from './reminders-automation.constants';

@Injectable()
export class RemindersAutomationScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(RemindersAutomationScheduler.name);

  constructor(
    @InjectQueue(REMINDERS_AUTOMATION_QUEUE)
    private readonly remindersAutomationQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    await this.remindersAutomationQueue.add(
      REMINDERS_AUTOMATION_CHECK_JOB,
      {},
      {
        jobId: REMINDERS_AUTOMATION_CHECK_JOB_ID,
        repeat: {
          every: 60_000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    this.logger.log(
      'Agendamento automatico de cobrancas configurado para verificar o horario salvo a cada minuto.',
    );
  }
}
