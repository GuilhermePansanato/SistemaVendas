import { Injectable } from '@nestjs/common';
import { WhatsAppConnectionsRepository } from '../../domain/repositories/whatsapp-connections.repository';

function buildWhatsAppClientKey(companyId: string) {
  return companyId === 'default-company' ? 'default' : `company-${companyId}`;
}

@Injectable()
export class GetWhatsAppConnectionUseCase {
  constructor(
    private readonly whatsappConnectionsRepository: WhatsAppConnectionsRepository,
  ) {}

  async execute(companyId: string) {
    const existingConnection =
      await this.whatsappConnectionsRepository.findByCompanyId(companyId);

    if (existingConnection) {
      return existingConnection;
    }

    return this.whatsappConnectionsRepository.create({
      companyId,
      clientKey: buildWhatsAppClientKey(companyId),
      provider: 'WHATSAPP_WEB_JS',
      status: 'DISCONNECTED',
    });
  }
}
