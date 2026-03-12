import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SmartAvailabilitySummary } from "./SmartAvailabilitySummary";

vi.mock("../hooks/useSmartAvailabilitySummary", () => ({
  useSmartAvailabilitySummary: () => ({
    summary: {
      timeZone: "UTC",
      totalMinutes: 600,
      activeDays: 3,
      generatedAt: "2026-03-12T10:00:00.000Z",
      days: [
        {
          day: 1,
          dayLabel: "Mon",
          totalMinutes: 240,
          windows: [
            {
              start: "2026-03-09T09:00:00.000Z",
              end: "2026-03-09T13:00:00.000Z",
            },
          ],
        },
        {
          day: 2,
          dayLabel: "Tue",
          totalMinutes: 360,
          windows: [
            {
              start: "2026-03-10T08:00:00.000Z",
              end: "2026-03-10T14:00:00.000Z",
            },
          ],
        },
      ],
      rawAvailabilityByDay: {
        1: [{ id: 1 }],
        2: [{ id: 2 }],
      },
    },
    isPending: false,
    isFetching: false,
    isReady: true,
    error: null,
    // This mock ignores query result shape on purpose.
    refetch: vi.fn(() => Promise.resolve({})),
  }),
}));

describe("SmartAvailabilitySummary", () => {
  it("renders summary widget", () => {
    render(<SmartAvailabilitySummary timeZone="UTC" />);

    expect(screen.getByText("Smart Availability Summary")).toBeInTheDocument();
    expect(screen.getByText("Total weekly availability")).toBeInTheDocument();
    expect(screen.getByText("Active days")).toBeInTheDocument();
  });
});
