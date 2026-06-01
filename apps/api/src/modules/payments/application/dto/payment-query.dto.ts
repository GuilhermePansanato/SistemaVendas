import { Transform } from 'class-transformer';
import { IsDate, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PaymentMethodType } from '../../domain/entities/payment';

const paymentMethodValues: PaymentMethodType[] = [
  'CASH',
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'OTHER',
];

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

export class PaymentQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value.trim())
  installmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value.trim())
  customerId?: string;

  @IsOptional()
  @IsIn(paymentMethodValues)
  method?: PaymentMethodType;

  @IsOptional()
  @IsDate()
  @Transform(({ value }: { value: unknown }) => normalizeDateInput(value))
  paidFrom?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }: { value: unknown }) => normalizeDateInput(value))
  paidTo?: Date;
}
