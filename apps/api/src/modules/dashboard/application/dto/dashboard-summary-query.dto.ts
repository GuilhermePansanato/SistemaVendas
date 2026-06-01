import { IsOptional, Matches } from 'class-validator';

export class DashboardSummaryQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Use o formato YYYY-MM-DD para a data inicial.',
  })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Use o formato YYYY-MM-DD para a data final.',
  })
  to?: string;
}
