import { shouldRunReminderAutomation } from './automation-schedule';

describe('shouldRunReminderAutomation', () => {
  const timeZone = 'America/Sao_Paulo';

  it('returns false before the configured time', () => {
    const now = new Date('2026-05-27T11:59:00.000Z');

    expect(shouldRunReminderAutomation(now, '09:00', null, timeZone)).toBe(
      false,
    );
  });

  it('returns true after the configured time when no run happened yet', () => {
    const now = new Date('2026-05-27T12:05:00.000Z');

    expect(shouldRunReminderAutomation(now, '09:00', null, timeZone)).toBe(
      true,
    );
  });

  it('returns false when the automation already ran on the same local day', () => {
    const now = new Date('2026-05-27T12:05:00.000Z');
    const lastRunAt = new Date('2026-05-27T12:01:00.000Z');

    expect(shouldRunReminderAutomation(now, '09:00', lastRunAt, timeZone)).toBe(
      false,
    );
  });

  it('returns true on the next local day after the configured time', () => {
    const now = new Date('2026-05-28T12:05:00.000Z');
    const lastRunAt = new Date('2026-05-27T12:01:00.000Z');

    expect(shouldRunReminderAutomation(now, '09:00', lastRunAt, timeZone)).toBe(
      true,
    );
  });
});
