import { describe, expect, it } from "vitest";

import {
  getDurationMinutes,
  getMinutesFromDateLike,
  getShortDayLabel,
  toHourMinuteLabel,
} from "~/bookings/lib/smartAvailabilityTime";

describe("smartAvailabilityTime", () => {
  it("builds day labels", () => {
    expect(getShortDayLabel(1)).toBe("Mon");
    expect(getShortDayLabel(7)).toBe("Sun");
  });

  it("calculates minutes and duration", () => {
    const start = new Date("2026-03-09T09:00:00.000Z");
    const end = new Date("2026-03-09T10:30:00.000Z");

    expect(getMinutesFromDateLike(start)).toBeGreaterThanOrEqual(0);
    expect(getDurationMinutes(start, end)).toBe(90);
  });

  it("formats labels", () => {
    expect(toHourMinuteLabel(135)).toBe("2h 15m");
  });
});
