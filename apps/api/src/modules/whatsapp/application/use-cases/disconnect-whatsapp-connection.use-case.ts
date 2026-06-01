import { Injectable } from '@nestjs/common';
import { WhatsAppSessionGateway } from '../../domain/services/whatsapp-session-gateway';
import { GetWhatsAppConnectionUseCase } from './get-whatsapp-connection.use-case';

@Injectable()
export class DisconnectWhatsAppConnectionUseCase {
  constructor(
    private readonly getWhatsAppConnectionUseCase: GetWhatsAppConnectionUseCase,
    private readonly whatsappSessionGateway: WhatsAppSessionGateway,
  ) {}

  async execute(companyId: string) {
    const connection =
      await this.getWhatsAppConnectionUseCase.execute(companyId);

    await this.whatsappSessionGateway.disconnectConnection(connection);

    return this.getWhatsAppConnectionUseCase.execute(companyId);
  }
}
