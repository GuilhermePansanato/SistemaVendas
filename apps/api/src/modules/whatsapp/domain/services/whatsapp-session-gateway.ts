import type { WhatsAppConnection } from '../entities/whatsapp-connection';

export interface WhatsAppSentMessage {
  providerMessageId: string | null;
}

export abstract class WhatsAppSessionGateway {
  abstract startConnection(connection: WhatsAppConnection): Promise<void>;
  abstract disconnectConnection(connection: WhatsAppConnection): Promise<void>;
  abstract sendTextMessage(
    connection: WhatsAppConnection,
    phoneNumber: string,
    message: string,
  ): Promise<WhatsAppSentMessage>;
}
