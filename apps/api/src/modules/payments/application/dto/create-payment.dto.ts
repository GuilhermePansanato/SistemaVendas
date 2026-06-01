import { Transform } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import type { PaymentMethodType } from '../../domain/entities/payment';

const paymentMethodValues: PaymentMethodType[] = [
  'CASH',
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'OTHER',
];

const normalizeNullableString = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

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

export class CreatePaymentDto {
  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
      maxDecimalPlaces: 2,
    },
    {
      message: 'Informe um valor valido com ate 2 casas decimais.',
    },
  )
  @Min(0.01)
  amount!: number;

  @IsDate()
  @Transform(({ value }: { value: unknown }) => normalizeDateInput(value))
  paidAt!: Date;

  @IsIn(paymentMethodValues)
  method!: PaymentMethodType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => normalizeNullableString(value))
  reference?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => normalizeNullableString(value))
  notes?: string | null;
}
