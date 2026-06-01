import { Injectable } from '@nestjs/common';
import { RemindersRepository } from '../../domain/repositories/reminders.repository';

@Injectable()
export class ListRemindersUseCase {
  constructor(private readonly remindersRepository: RemindersRepository) {}

  execute(companyId: string, limit = 20) {
    return this.remindersRepository.listRecent(companyId, limit);
  }
}
