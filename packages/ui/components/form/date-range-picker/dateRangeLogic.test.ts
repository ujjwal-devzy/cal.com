import { describe, it, expect } from "vitest";

import {
  calculateHoverDateRange,
  calculateNewDateRange,
  getDateRangeDisplayText,
  normalizeDateRange,
} from "./dateRangeLogic";

describe("calculateNewDateRange", () => {
  // Helper dates for testing
  const date1 = new Date("2024-01-01");
  const date2 = new Date("2024-01-10");
  const date3 = new Date("2024-01-20");
  const date4 = new Date("2024-01-05"); // Between date1 and date2

  describe("Airbnb-style date range selection", () => {
    it("should start a new range when no start date is set", () => {
      const result = calculateNewDateRange({
        startDate: undefined,
        endDate: undefined,
        clickedDate: date1,
      });

      expect(result).toEqual({
        startDate: date1,
        endDate: undefined,
      });
    });

    it("should start a new range when both dates are already set", () => {
      const result = calculateNewDateRange({
        startDate: date1,
        endDate: date2,
        clickedDate: date3,
      });

      expect(result).toEqual({
        startDate: date3,
        endDate: undefined,
      });
    });

    it("should complete the range when only start date is set (clicked date is after start)", () => {
      const result = calculateNewDateRange({
        startDate: date1,
        endDate: undefined,
        clickedDate: date2,
      });

      expect(result).toEqual({
        startDate: date1,
        endDate: date2,
      });
    });

    it("should complete the range and swap dates when clicked date is before start date", () => {
      const result = calculateNewDateRange({
        startDate: date2,
        endDate: undefined,
        clickedDate: date1,
      });

      expect(result).toEqual({
        startDate: date1,
        endDate: date2,
      });
    });

    it("should handle same date click when only start date is set", () => {
      const result = calculateNewDateRange({
        startDate: date1,
        endDate: undefined,
        clickedDate: date1,
      });

      expect(result).toEqual({
        startDate: date1,
        endDate: date1,
      });
    });

    it("should handle clicking a date between start and end when range is complete", () => {
      const result = calculateNewDateRange({
        startDate: date1,
        endDate: date2,
        clickedDate: date4,
      });

      expect(result).toEqual({
        startDate: date4,
        endDate: undefined,
      });
    });

    it("should reset range when clicking any date after both dates are set", () => {
      const result = calculateNewDateRange({
        startDate: date1,
        endDate: date2,
        clickedDate: date1, // Click same as start
      });

      expect(result).toEqual({
        startDate: date1,
        endDate: undefined,
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle dates with different times on same day", () => {
      const morning = new Date("2024-01-01T08:00:00");
      const evening = new Date("2024-01-01T20:00:00");

      const result = calculateNewDateRange({
        startDate: morning,
        endDate: undefined,
        clickedDate: evening,
      });

      expect(result).toEqual({
        startDate: morning,
        endDate: evening,
      });
    });

    it("should maintain immutability - not modify input dates", () => {
      const originalStart = new Date("2024-01-01");
      const originalEnd = new Date("2024-01-10");
      const clickedDate = new Date("2024-01-15");

      calculateNewDateRange({
        startDate: originalStart,
        endDate: originalEnd,
        clickedDate,
      });

      // Original dates should not be modified
      expect(originalStart.toISOString()).toBe(new Date("2024-01-01").toISOString());
      expect(originalEnd.toISOString()).toBe(new Date("2024-01-10").toISOString());
    });

    it("should handle selecting dates in reverse order", () => {
      // First click - set start
      const result1 = calculateNewDateRange({
        startDate: undefined,
        endDate: undefined,
        clickedDate: date2,
      });

      expect(result1).toEqual({
        startDate: date2,
        endDate: undefined,
      });

      // Second click - click earlier date, should swap
      const result2 = calculateNewDateRange({
        startDate: result1.startDate,
        endDate: result1.endDate,
        clickedDate: date1,
      });

      expect(result2).toEqual({
        startDate: date1,
        endDate: date2,
      });
    });

    it("should start fresh after completing a range", () => {
      // Complete a range
      const result1 = calculateNewDateRange({
        startDate: date1,
        endDate: date2,
        clickedDate: date3, // This should reset
      });

      expect(result1).toEqual({
        startDate: date3,
        endDate: undefined,
      });

      // Should be able to complete the new range
      const result2 = calculateNewDateRange({
        startDate: result1.startDate,
        endDate: result1.endDate,
        clickedDate: date2,
      });

      expect(result2).toEqual({
        startDate: date2,
        endDate: date3,
      });
    });
  });
});

describe("calculateHoverDateRange", () => {
  const date1 = new Date("2024-01-01");
  const date2 = new Date("2024-01-10");
  const date3 = new Date("2024-01-20");

  it("returns undefined when start date is not set", () => {
    const result = calculateHoverDateRange({
      startDate: undefined,
      endDate: undefined,
      hoveredDate: date2,
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined when range is already complete", () => {
    const result = calculateHoverDateRange({
      startDate: date1,
      endDate: date2,
      hoveredDate: date3,
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined when hovered date is not set", () => {
    const result = calculateHoverDateRange({
      startDate: date1,
      endDate: undefined,
      hoveredDate: undefined,
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined when hovered date matches start date exactly", () => {
    const result = calculateHoverDateRange({
      startDate: date1,
      endDate: undefined,
      hoveredDate: new Date("2024-01-01"),
    });

    expect(result).toBeUndefined();
  });

  it("creates a forward hover range when hovered date is after start date", () => {
    const result = calculateHoverDateRange({
      startDate: date1,
      endDate: undefined,
      hoveredDate: date2,
    });

    expect(result).toEqual({ from: date1, to: date2 });
  });

  it("creates a reversed hover range when hovered date is before start date", () => {
    const result = calculateHoverDateRange({
      startDate: date2,
      endDate: undefined,
      hoveredDate: date1,
    });

    expect(result).toEqual({ from: date1, to: date2 });
  });
});

describe("getDateRangeDisplayText", () => {
  const date1 = new Date("2024-01-01");
  const date2 = new Date("2024-01-10");

  const dateFormatter = (date: Date) => date.toISOString().slice(0, 10);

  it("returns pick a date text when no start date exists", () => {
    const result = getDateRangeDisplayText({
      startDate: undefined,
      endDate: undefined,
      dateFormatter,
    });

    expect(result).toBe("Pick a date");
  });

  it("returns start date and end placeholder when only start date exists", () => {
    const result = getDateRangeDisplayText({
      startDate: date1,
      endDate: undefined,
      dateFormatter,
    });

    expect(result).toBe("2024-01-01 - End");
  });

  it("returns full formatted date range when both dates exist", () => {
    const result = getDateRangeDisplayText({
      startDate: date1,
      endDate: date2,
      dateFormatter,
    });

    expect(result).toBe("2024-01-01 - 2024-01-10");
  });

  it("supports custom placeholder and pending end text", () => {
    const emptyResult = getDateRangeDisplayText({
      startDate: undefined,
      endDate: undefined,
      dateFormatter,
      placeholderText: "Choose dates",
      pendingEndDateText: "Until",
    });

    const partialResult = getDateRangeDisplayText({
      startDate: date1,
      endDate: undefined,
      dateFormatter,
      placeholderText: "Choose dates",
      pendingEndDateText: "Until",
    });

    expect(emptyResult).toBe("Choose dates");
    expect(partialResult).toBe("2024-01-01 - Until");
  });
});

describe("normalizeDateRange", () => {
  const date1 = new Date("2024-01-01");
  const date2 = new Date("2024-01-10");
  const date3 = new Date("2024-01-20");

  it("returns empty range when both dates are missing", () => {
    const result = normalizeDateRange({
      startDate: undefined,
      endDate: undefined,
    });

    expect(result).toEqual({ startDate: undefined, endDate: undefined });
  });

  it("normalizes an end-only range to start-only", () => {
    const result = normalizeDateRange({
      startDate: undefined,
      endDate: date2,
    });

    expect(result).toEqual({ startDate: date2, endDate: undefined });
  });

  it("swaps dates when end date is before start date", () => {
    const result = normalizeDateRange({
      startDate: date3,
      endDate: date1,
    });

    expect(result).toEqual({ startDate: date1, endDate: date3 });
  });

  it("clamps both dates inside min and max bounds", () => {
    const result = normalizeDateRange({
      startDate: date1,
      endDate: date3,
      minDate: date2,
      maxDate: date2,
    });

    expect(result).toEqual({ startDate: date2, endDate: date2 });
  });

  it("keeps valid ranges unchanged", () => {
    const result = normalizeDateRange({
      startDate: date1,
      endDate: date2,
      minDate: new Date("2023-12-01"),
      maxDate: new Date("2024-12-31"),
    });

    expect(result).toEqual({ startDate: date1, endDate: date2 });
  });
});
