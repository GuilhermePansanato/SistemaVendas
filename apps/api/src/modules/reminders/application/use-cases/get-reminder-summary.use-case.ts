import { Injectable } from '@nestjs/common';
import { RemindersRepository } from '../../domain/repositories/reminders.repository';

@Injectable()
export class GetReminderSummaryUseCase {
  constructor(private readonly remindersRepository: RemindersRepository) {}

  execute(companyId: string) {
    return this.remindersRepository.getSummary(companyId);
  }
}
