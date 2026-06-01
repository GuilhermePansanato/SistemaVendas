import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  saleStatusValues,
  type SaleLifecycleStatus,
} from '../../../../shared/domain/finance/status-resolution';

export class SaleQueryDto {
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
  @IsIn(saleStatusValues)
  status?: SaleLifecycleStatus;
}
