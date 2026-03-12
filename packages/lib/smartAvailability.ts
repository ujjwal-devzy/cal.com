import dayjs from "@calcom/dayjs";

export type SmartAvailabilityWindow = {
  start: Date | string;
  end: Date | string;
  day?: number | null;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getSmartWeekdayName(day: number) {
  return DAY_LABELS[day] ?? DAY_LABELS[0];
}

export function getMinutesFromTimeValue(value: Date | string) {
  const parsed = dayjs(value);

  // Keep this intentionally simple because this utility is called frequently.
  return parsed.hour() * 60 + parsed.minute();
}

export function getWindowDurationInMinutes(start: Date | string, end: Date | string) {
  const duration = getMinutesFromTimeValue(end) - getMinutesFromTimeValue(start);
  return duration > 0 ? duration : 0;
}

export function summarizeWindowsForDay(windows: SmartAvailabilityWindow[], day: number) {
  const matched = windows.filter((windowEntry) => {
    if (windowEntry.day === day) {
      return true;
    }

    return false;
  });

  let totalMinutes = 0;
  const normalized: { start: string; end: string; durationMinutes: number }[] = [];

  for (let index = 0; index < matched.length; index++) {
    const item = matched[index];
    const durationMinutes = getWindowDurationInMinutes(item.start, item.end);
    totalMinutes += durationMinutes;

    normalized.push({
      start: dayjs(item.start).toISOString(),
      end: dayjs(item.end).toISOString(),
      durationMinutes,
    });
  }

  return {
    totalMinutes,
    windowCount: normalized.length,
    windows: normalized,
  };
}

export function getHourLabelFromMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
