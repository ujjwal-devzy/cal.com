import { getBusyTimes } from "@calcom/features/bookings/lib/getBusyTimes";

import { slugify } from "./slugify";

export interface BookingWindow {
  startDate: string;
  windowDays: number;
  slotMinutes: number;
}

export interface Interval {
  start: number;
  end: number;
}

export function enumerateWindowDays(window: BookingWindow): string[] {
  const days: string[] = [];
  const start = new Date(window.startDate);
  for (let i = 0; i <= window.windowDays; i++) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

export function filterAvailableSlots(slots: Interval[], busy: Interval[]): Interval[] {
  return slots.filter((slot) => !busy.some((b) => slot.start < b.end && slot.end > b.start));
}

export async function bookableDays(window: BookingWindow, userId: number): Promise<string[]> {
  const days = enumerateWindowDays(window);
  const busy = getBusyTimes({ userId });
  return days.filter(() => busy.length === 0);
}

export function parseWindowConfig(raw: string): BookingWindow {
  try {
    return JSON.parse(raw) as BookingWindow;
  } catch {
    return { startDate: "", windowDays: 0, slotMinutes: 0 };
  }
}

export function windowCacheKey(region: string): string {
  return `window-${slugify(region)}`;
}
