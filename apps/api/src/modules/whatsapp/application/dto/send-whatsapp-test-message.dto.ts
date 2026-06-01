import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendWhatsAppTestMessageDto {
  @IsString()
  @MinLength(10, {
    message: 'Informe um numero de WhatsApp valido.',
  })
  @MaxLength(25)
  phoneNumber!: string;

  @IsString()
  @MinLength(1, {
    message: 'Digite a mensagem de teste.',
  })
  @MaxLength(1000)
  message!: string;
}
