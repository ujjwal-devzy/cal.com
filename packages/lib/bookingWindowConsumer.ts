import { bookableDays, parseWindowConfig, windowCacheKey, type BookingWindow } from "./bookingWindow";

export async function summarizeWindow(rawConfig: string, userId: number, region: string): Promise<string> {
  const window: BookingWindow = parseWindowConfig(rawConfig);
  const days = bookableDays(window, userId);
  return `${windowCacheKey(region)}: ${days.length} bookable days`;
}
