import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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

export class CreateCustomerDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @Transform(({ value }: { value: unknown }) => normalizeRequiredString(value))
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => normalizeRequiredString(value))
  phone!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => normalizeRequiredString(value))
  whatsappPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }: { value: unknown }) => normalizeNullableString(value))
  document?: string | null;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) => {
    const normalizedValue = normalizeNullableString(value);
    return normalizedValue ? normalizedValue.toLowerCase() : null;
  })
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) => normalizeNullableString(value))
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
