interface TimeZoneDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function getTimeZoneDateParts(date: Date, timeZone: string): TimeZoneDateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);

  const values = parts.reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== 'literal') {
      accumulator[part.type] = part.value;
    }

    return accumulator;
  }, {});

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function toDayKey(date: Date, timeZone: string) {
  const parts = getTimeZoneDateParts(date, timeZone);

  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function toCurrentMinutes(date: Date, timeZone: string) {
  const parts = getTimeZoneDateParts(date, timeZone);
  return parts.hour * 60 + parts.minute;
}

function toScheduledMinutes(sendTime: string) {
  const [hours, minutes] = sendTime.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

export function shouldRunReminderAutomation(
  now: Date,
  sendTime: string,
  lastAutomatedRunAt: Date | null,
  timeZone: string,
) {
  if (toCurrentMinutes(now, timeZone) < toScheduledMinutes(sendTime)) {
    return false;
  }

  if (!lastAutomatedRunAt) {
    return true;
  }

  return toDayKey(now, timeZone) !== toDayKey(lastAutomatedRunAt, timeZone);
}
