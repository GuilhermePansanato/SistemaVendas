export type ReminderStatusType = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELED';
export type ReminderTriggerType = 'BEFORE_DUE' | 'ON_DUE';
export type ReminderFailureReasonType =
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

export interface ReminderSettingsSnapshot {
  defaultSendTime: string;
  lastAutomatedRunAt: Date | null;
}

export interface ReminderAutomationTarget {
  companyId: string;
  defaultSendTime: string;
  lastAutomatedRunAt: Date | null;
}

export interface ReminderListItem {
  id: string;
  customerName: string;
  customerWhatsappPhone: string;
  saleDescription: string | null;
  installmentNumber: number;
  dueDate: Date;
  triggerType: ReminderTriggerType;
  messageBody: string;
  status: ReminderStatusType;
  failureReason: ReminderFailureReasonType | null;
  errorMessage: string | null;
  sentAt: Date | null;
  attemptedAt: Date | null;
  createdAt: Date;
}

export interface ReminderInstallmentCandidate {
  customerId: string;
  customerName: string;
  customerWhatsappPhone: string;
  saleDescription: string | null;
  installmentId: string;
  installmentNumber: number;
  dueDate: Date;
  amount: number;
}

export interface ReminderRuleSnapshot {
  id: string;
  name: string;
  triggerType: ReminderTriggerType;
  daysBefore: number;
  template: string;
}

export interface ReminderMessageSnapshot {
  id: string;
  status: ReminderStatusType;
  retryCount: number;
}
