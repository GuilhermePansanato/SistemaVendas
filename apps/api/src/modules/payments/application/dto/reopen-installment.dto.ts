import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReopenInstallmentDto {
  @IsString()
  @MinLength(1, {
    message: 'Digite sua senha para confirmar a reabertura da parcela.',
  })
  @MaxLength(120)
  password!: string;
}
