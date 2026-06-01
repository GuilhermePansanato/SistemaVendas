import { Transform } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  installmentStatusValues,
  type InstallmentLifecycleStatus,
} from '../../../../shared/domain/finance/status-resolution';

const normalizeDateInput = (value: unknown) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00.000Z`);
  }

  const parsedDate = new Date(trimmed);
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate;
};

export class InstallmentQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value.trim())
  customerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value.trim())
  saleId?: string;

  @IsOptional()
  @IsIn(installmentStatusValues)
  status?: InstallmentLifecycleStatus;

  @IsOptional()
  @IsDate()
  @Transform(({ value }: { value: unknown }) => normalizeDateInput(value))
  dueFrom?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }: { value: unknown }) => normalizeDateInput(value))
  dueTo?: Date;
}
