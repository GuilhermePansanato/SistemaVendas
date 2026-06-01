import { Injectable } from '@nestjs/common';
import { UpdateReminderSettingsDto } from '../dto/update-reminder-settings.dto';
import { RemindersRepository } from '../../domain/repositories/reminders.repository';

@Injectable()
export class UpdateReminderSettingsUseCase {
  constructor(private readonly remindersRepository: RemindersRepository) {}

  execute(companyId: string, input: UpdateReminderSettingsDto) {
    return this.remindersRepository.updateSettings(companyId, {
      defaultSendTime: input.defaultSendTime,
      lastAutomatedRunAt: null,
    });
  }
}
