export const whatsappConnectionStatusValues = [
  'DISCONNECTED',
  'PENDING_QR',
  'CONNECTING',
  'CONNECTED',
  'AUTH_FAILURE',
] as const;

export const whatsappConnectionEventTypeValues = [
  'QR_GENERATED',
  'AUTHENTICATED',
  'READY',
  'DISCONNECTED',
  'AUTH_FAILURE',
  'SEND_BLOCKED',
] as const;

export type WhatsAppConnectionStatus =
  (typeof whatsappConnectionStatusValues)[number];
export type WhatsAppConnectionEventType =
  (typeof whatsappConnectionEventTypeValues)[number];

export type WhatsAppConnectionProvider = 'WHATSAPP_WEB_JS';

export interface WhatsAppConnection {
  id: string;
  companyId: string;
  clientKey: string;
  provider: WhatsAppConnectionProvider;
  status: WhatsAppConnectionStatus;
  displayName: string | null;
  phoneNumber: string | null;
  qrCode: string | null;
  sessionPath: string | null;
  lastConnectedAt: Date | null;
  lastDisconnectedAt: Date | null;
  lastQrGeneratedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}
