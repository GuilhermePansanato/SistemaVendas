import { Matches } from 'class-validator';

export class UpdateReminderSettingsDto {
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Informe um horario valido no formato HH:mm.',
  })
  defaultSendTime!: string;
}
