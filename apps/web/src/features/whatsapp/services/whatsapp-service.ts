import { apiClient } from '../../../shared/services/api-client';
import type { WhatsAppConnection } from '../types/whatsapp-connection';

export interface SendWhatsAppTestMessageInput {
  phoneNumber: string;
  message: string;
}

export async function getWhatsAppConnection() {
  const response = await apiClient.get<WhatsAppConnection>(
    '/whatsapp/connection',
  );

  return response.data;
}

export async function connectWhatsApp() {
  const response = await apiClient.post<WhatsAppConnection>(
    '/whatsapp/connection/connect',
  );

  return response.data;
}

export async function disconnectWhatsApp() {
  const response = await apiClient.post<WhatsAppConnection>(
    '/whatsapp/connection/disconnect',
  );

  return response.data;
}

export async function sendWhatsAppTestMessage(
  input: SendWhatsAppTestMessageInput,
) {
  const response = await apiClient.post<{
    success: boolean;
    providerMessageId: string | null;
  }>('/whatsapp/test-message', input);

  return response.data;
}
