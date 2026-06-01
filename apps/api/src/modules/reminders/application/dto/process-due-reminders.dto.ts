import { Transform } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

function parseDateInput(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00.000Z`);
  }

  const parsedDate = new Date(trimmed);
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate;
}

export class ProcessDueRemindersDto {
  @IsOptional()
  @Transform(({ value }) => parseDateInput(value))
  @IsDate({
    message: 'Informe uma data de referencia valida.',
  })
  referenceDate?: Date;
}
