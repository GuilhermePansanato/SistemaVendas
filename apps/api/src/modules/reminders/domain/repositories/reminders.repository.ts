import type {
  ReminderAutomationTarget,
  ReminderFailureReasonType,
  ReminderInstallmentCandidate,
  ReminderListItem,
  ReminderMessageSnapshot,
  ReminderRuleSnapshot,
  ReminderSettingsSnapshot,
  ReminderSummary,
  ReminderTriggerType,
} from '../entities/reminder';

export interface UpsertReminderAttemptData {
  companyId: string;
  customerId: string;
  installmentId: string;
  ruleId: string;
  whatsappConnectionId: string | null;
  triggerType: ReminderTriggerType;
  triggerDate: Date;
  scheduledFor: Date;
  messageBody: string;
  status: 'SENT' | 'FAILED';
  retryCount: number;
  attemptedAt: Date;
  sentAt: Date | null;
  failureReason: ReminderFailureReasonType | null;
  providerMessageId: string | null;
  errorMessage: string | null;
}

export abstract class RemindersRepository {
  abstract getSettings(companyId: string): Promise<ReminderSettingsSnapshot>;
  abstract updateSettings(
    companyId: string,
    input: ReminderSettingsSnapshot,
  ): Promise<ReminderSettingsSnapshot>;
  abstract listAutomationTargets(): Promise<ReminderAutomationTarget[]>;
  abstract markAutomatedRun(companyId: string, executedAt: Date): Promise<void>;
  abstract ensureDefaultRules(
    companyId: string,
  ): Promise<ReminderRuleSnapshot[]>;
  abstract findInstallmentsDueOn(
    companyId: string,
    date: Date,
  ): Promise<ReminderInstallmentCandidate[]>;
  abstract findReminderMessage(
    companyId: string,
    installmentId: string,
    triggerType: ReminderTriggerType,
    triggerDate: Date,
  ): Promise<ReminderMessageSnapshot | null>;
  abstract upsertReminderAttempt(
    data: UpsertReminderAttemptData,
  ): Promise<void>;
  abstract listRecent(
    companyId: string,
    limit: number,
  ): Promise<ReminderListItem[]>;
  abstract getSummary(companyId: string): Promise<ReminderSummary>;
}
