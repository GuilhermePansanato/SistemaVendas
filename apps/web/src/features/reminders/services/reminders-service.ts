import { apiClient } from '../../../shared/services/api-client';
import type {
  ProcessDueRemindersResult,
  ReminderListItem,
  ReminderSettings,
  ReminderSummary,
} from '../types/reminder';

export interface UpdateReminderSettingsInput {
  defaultSendTime: string;
}

export async function getReminderSettings() {
  const response = await apiClient.get<ReminderSettings>('/reminders/settings');

  return response.data;
}

export async function updateReminderSettings(
  input: UpdateReminderSettingsInput,
) {
  const response = await apiClient.patch<ReminderSettings>(
    '/reminders/settings',
    input,
  );

  return response.data;
}

export async function getReminderSummary() {
  const response = await apiClient.get<ReminderSummary>('/reminders/summary');

  return response.data;
}

export async function getReminders() {
  const response = await apiClient.get<ReminderListItem[]>('/reminders');

  return response.data;
}

export async function processDueReminders() {
  const response = await apiClient.post<ProcessDueRemindersResult>(
    '/reminders/process',
  );

  return response.data;
}
