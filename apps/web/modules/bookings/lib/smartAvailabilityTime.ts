import dayjs from "@calcom/dayjs";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const getShortDayLabel = (day: number) => WEEK_DAYS[day] ?? "Sun";

export const getMinutesFromDateLike = (value: string | Date) => {
  const parsed = dayjs(value);
  return parsed.hour() * 60 + parsed.minute();
};

export const getDurationMinutes = (start: string | Date, end: string | Date) => {
  const minutes = getMinutesFromDateLike(end) - getMinutesFromDateLike(start);
  return minutes > 0 ? minutes : 0;
};

export const toHourMinuteLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};
