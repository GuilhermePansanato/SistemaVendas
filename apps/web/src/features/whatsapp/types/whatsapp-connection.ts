export type WhatsAppConnectionStatus =
  | 'DISCONNECTED'
  | 'PENDING_QR'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'AUTH_FAILURE';

export interface WhatsAppConnection {
  id: string;
  clientKey: string;
  provider: string;
  status: WhatsAppConnectionStatus;
  displayName: string | null;
  phoneNumber: string | null;
  qrCode: string | null;
  sessionPath: string | null;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  lastQrGeneratedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}
