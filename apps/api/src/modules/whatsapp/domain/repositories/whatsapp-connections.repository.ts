import type {
  WhatsAppConnection,
  WhatsAppConnectionEventType,
  WhatsAppConnectionProvider,
  WhatsAppConnectionStatus,
} from '../entities/whatsapp-connection';

export interface CreateWhatsAppConnectionData {
  companyId: string;
  clientKey: string;
  provider: WhatsAppConnectionProvider;
  status: WhatsAppConnectionStatus;
}

export interface UpdateWhatsAppConnectionData {
  status?: WhatsAppConnectionStatus;
  displayName?: string | null;
  phoneNumber?: string | null;
  qrCode?: string | null;
  sessionPath?: string | null;
  lastConnectedAt?: Date | null;
  lastDisconnectedAt?: Date | null;
  lastQrGeneratedAt?: Date | null;
  lastError?: string | null;
}

export interface CreateWhatsAppConnectionEventData {
  companyId: string;
  connectionId: string;
  type: WhatsAppConnectionEventType;
  message?: string | null;
  payload?: Record<string, unknown> | null;
}

export abstract class WhatsAppConnectionsRepository {
  abstract findByCompanyId(
    companyId: string,
  ): Promise<WhatsAppConnection | null>;
  abstract create(
    data: CreateWhatsAppConnectionData,
  ): Promise<WhatsAppConnection>;
  abstract update(
    id: string,
    data: UpdateWhatsAppConnectionData,
  ): Promise<WhatsAppConnection>;
  abstract createEvent(data: CreateWhatsAppConnectionEventData): Promise<void>;
}
