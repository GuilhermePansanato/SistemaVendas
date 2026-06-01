export type ReminderStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELED';
export type ReminderTriggerType = 'BEFORE_DUE' | 'ON_DUE';
export type ReminderFailureReason =
  | 'WHATSAPP_DISCONNECTED'
  | 'AUTH_FAILURE'
  | 'DELIVERY_ERROR'
  | 'UNKNOWN';

export interface ReminderSummary {
  pending: number;
  sent: number;
  failed: number;
  blockedByConnection: number;
}

export interface ReminderSettings {
  defaultSendTime: string;
}

export interface ReminderListItem {
  id: string;
  customerName: string;
  customerWhatsappPhone: string;
  saleDescription: string | null;
  installmentNumber: number;
  dueDate: string;
  triggerType: ReminderTriggerType;
  messageBody: string;
  status: ReminderStatus;
  failureReason: ReminderFailureReason | null;
  errorMessage: string | null;
  sentAt: string | null;
  attemptedAt: string | null;
  createdAt: string;
}

export interface ProcessDueRemindersResult {
  referenceDate: string;
  created: number;
  sent: number;
  failed: number;
  skipped: number;
}
