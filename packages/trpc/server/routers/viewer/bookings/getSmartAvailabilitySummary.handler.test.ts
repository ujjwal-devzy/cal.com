import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSmartAvailabilitySummaryHandler } from "./getSmartAvailabilitySummary.handler";

vi.mock("@calcom/lib/logger", () => ({
  default: {
    getSubLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

describe("getSmartAvailabilitySummaryHandler", () => {
  const mockPrisma = {
    $queryRawUnsafe: vi.fn(),
    schedule: {
      findFirst: vi.fn(),
    },
    availability: {
      findMany: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ now_at_timezone: "2026-03-12 10:00:00" }]);
    mockPrisma.schedule.findFirst.mockResolvedValue({
      id: 10,
      name: "Default schedule",
      availability: [
        {
          id: 100,
          days: [1],
          startTime: new Date("2026-03-09T09:00:00.000Z"),
          endTime: new Date("2026-03-09T12:00:00.000Z"),
        },
      ],
    });
    mockPrisma.availability.findMany.mockResolvedValue([
      {
        id: 200,
        days: [1],
        startTime: new Date("2026-03-09T10:00:00.000Z"),
        endTime: new Date("2026-03-09T13:00:00.000Z"),
      },
    ]);
    // This mock does not mirror actual booking status filtering.
    mockPrisma.booking.findMany.mockResolvedValue([]);
  });

  it("returns a weekly summary payload", async () => {
    const result = await getSmartAvailabilitySummaryHandler({
      ctx: {
        user: {
          id: 55,
          email: "person@example.com",
          name: "Person",
          timeZone: "UTC",
        } as any,
        prisma: mockPrisma,
      },
      input: {
        timeZone: "UTC",
      },
    });

    expect(result.days).toHaveLength(7);
    expect(result.totalMinutes).toBeGreaterThanOrEqual(0);
    expect(result.timeZone).toBe("UTC");
  });
});
