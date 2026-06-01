import { BadRequestException, Injectable } from '@nestjs/common';
import { WhatsAppSessionGateway } from '../../domain/services/whatsapp-session-gateway';
import { SendWhatsAppTestMessageDto } from '../dto/send-whatsapp-test-message.dto';
import { GetWhatsAppConnectionUseCase } from './get-whatsapp-connection.use-case';

@Injectable()
export class SendWhatsAppTestMessageUseCase {
  constructor(
    private readonly getWhatsAppConnectionUseCase: GetWhatsAppConnectionUseCase,
    private readonly whatsappSessionGateway: WhatsAppSessionGateway,
  ) {}

  async execute(companyId: string, input: SendWhatsAppTestMessageDto) {
    const connection =
      await this.getWhatsAppConnectionUseCase.execute(companyId);
    const message = input.message.trim();

    if (connection.status !== 'CONNECTED') {
      throw new BadRequestException(
        'Conecte o WhatsApp antes de enviar uma mensagem de teste.',
      );
    }

    if (!message) {
      throw new BadRequestException('Digite a mensagem de teste.');
    }

    try {
      const sentMessage = await this.whatsappSessionGateway.sendTextMessage(
        connection,
        input.phoneNumber,
        message,
      );

      return {
        success: true,
        providerMessageId: sentMessage.providerMessageId,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'WHATSAPP_NOT_CONNECTED' ||
          error.message === 'INVALID_PHONE_NUMBER')
      ) {
        throw new BadRequestException(
          error.message === 'INVALID_PHONE_NUMBER'
            ? 'Informe um numero de WhatsApp valido para o teste.'
            : 'A sessao do WhatsApp nao esta pronta. Gere um novo QR code e conecte novamente.',
        );
      }

      throw new BadRequestException(
        'Nao foi possivel enviar a mensagem de teste pelo WhatsApp.',
      );
    }
  }
}
