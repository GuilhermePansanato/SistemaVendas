import { Injectable } from '@nestjs/common';
import { RemindersRepository } from '../../domain/repositories/reminders.repository';

@Injectable()
export class GetReminderSettingsUseCase {
  constructor(private readonly remindersRepository: RemindersRepository) {}

  execute(companyId: string) {
    return this.remindersRepository.getSettings(companyId);
  }
}
