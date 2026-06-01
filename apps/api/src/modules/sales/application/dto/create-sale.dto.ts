import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { PaymentMethodType } from '../../../payments/domain/entities/payment';

const normalizeNullableString = (value: unknown) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const normalizeRequiredString = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
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

const paymentMethodValues: PaymentMethodType[] = [
  'CASH',
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'OTHER',
];

export class CreateSalePaymentDto {
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

export class CreateSaleInstallmentDto {
  @IsDate()
  @Transform(({ value }: { value: unknown }) => normalizeDateInput(value))
  dueDate!: Date;
}

export class CreateSaleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Transform(({ value }: { value: unknown }) => normalizeRequiredString(value))
  customerId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  @Transform(({ value }: { value: unknown }) => normalizeNullableString(value))
  description?: string | null;

  @IsNumber(
    {
      allowInfinity: false,
      allowNaN: false,
      maxDecimalPlaces: 2,
    },
    {
      message: 'Informe um valor total valido com ate 2 casas decimais.',
    },
  )
  @Min(0.01)
  totalAmount!: number;

  @IsDate()
  @Transform(({ value }: { value: unknown }) => normalizeDateInput(value))
  saleDate!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => normalizeNullableString(value))
  notes?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(36)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleInstallmentDto)
  installments!: CreateSaleInstallmentDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateSalePaymentDto)
  payment?: CreateSalePaymentDto;
}
