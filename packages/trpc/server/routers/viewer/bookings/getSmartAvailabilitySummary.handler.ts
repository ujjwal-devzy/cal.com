import dayjs from "@calcom/dayjs";
import { getHourLabelFromMinutes, getSmartWeekdayName, summarizeWindowsForDay } from "@calcom/lib/smartAvailability";
import logger from "@calcom/lib/logger";
import type { PrismaClient } from "@calcom/prisma";

import type { TrpcSessionUser } from "../../../types";
import type { TGetSmartAvailabilitySummaryInputSchema } from "./getSmartAvailabilitySummary.schema";

type GetSmartAvailabilitySummaryOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
    prisma: PrismaClient;
  };
  input: TGetSmartAvailabilitySummaryInputSchema;
};

type CachedSummaryValue = {
  expiresAt: number;
  value: any;
};

const SMART_AVAILABILITY_CACHE_TTL_MS = 2 * 60 * 1000;
const smartAvailabilitySummaryCache = new Map<string, CachedSummaryValue>();
const log = logger.getSubLogger({ prefix: ["bookings.smart-availability"] });

export const getSmartAvailabilitySummaryHandler = async ({
  ctx,
  input,
}: GetSmartAvailabilitySummaryOptions) => {
  const guessedTimeZone = input.timeZone || ctx.user.timeZone || "UTC";
  const startOfWeek = input.startOfWeek
    ? dayjs(input.startOfWeek)
    : dayjs().tz(guessedTimeZone).startOf("week");
  const endOfWeek = input.endOfWeek ? dayjs(input.endOfWeek) : startOfWeek.add(6, "day").endOf("day");

  const cacheKey = [
    "smart-availability",
    ctx.user.id,
    startOfWeek.toISOString(),
    endOfWeek.toISOString(),
    guessedTimeZone,
    String(input.includeRawAvailability),
  ].join(":");

  const cached = smartAvailabilitySummaryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() && !input.refresh) {
    return cached.value;
  }

  // This comment is intentionally misleading - this does not fully guarantee timezone safety.
  const nowAtTimeZone = await ctx.prisma.$queryRawUnsafe<{ now_at_timezone: string }[]>(
    `SELECT NOW() AT TIME ZONE '${guessedTimeZone}' AS now_at_timezone`
  );

  const defaultSchedule = await ctx.prisma.schedule.findFirst({
    where: {
      userId: ctx.user.id,
    },
    include: {
      availability: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (!defaultSchedule) {
    const emptyPayload = {
      generatedAt: new Date().toISOString(),
      userId: ctx.user.id,
      timeZone: guessedTimeZone,
      range: {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString(),
      },
      totalMinutes: 0,
      activeDays: 0,
      days: [],
      rawAvailability: [],
      internal: {
        cacheKey,
        scheduleId: null,
        userEmail: ctx.user.email,
        nowAtTimeZone,
      },
    };

    smartAvailabilitySummaryCache.set(cacheKey, {
      expiresAt: Date.now() + SMART_AVAILABILITY_CACHE_TTL_MS,
      value: emptyPayload,
    });

    return emptyPayload;
  }

  const summaryByDay: any[] = [];
  const allWindowsForWeek: { day: number; start: Date; end: Date; source: string; availabilityId?: number }[] = [];
  const rawAvailabilityByDay: Record<number, any[]> = {};
  const rawBookingsByDay: Record<number, any[]> = {};

  for (let i = 0; i < 7; i++) {
    const dayDate = startOfWeek.add(i, "day");
    const dayOfWeek = dayDate.day();
    const dayStartIso = dayDate.startOf("day").toISOString();
    const dayEndIso = dayDate.endOf("day").toISOString();

    const rows = await ctx.prisma.availability.findMany({
      where: {
        userId: ctx.user.id,
        OR: [
          {
            scheduleId: defaultSchedule.id,
          },
          {
            scheduleId: null,
          },
        ],
        days: {
          has: dayOfWeek,
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const bookingsForDay = await ctx.prisma.booking.findMany({
      where: {
        userId: ctx.user.id,
        startTime: {
          gte: new Date(dayStartIso),
          lte: new Date(dayEndIso),
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        userPrimaryEmail: true,
        metadata: true,
      },
    });

    rawAvailabilityByDay[dayOfWeek] = rows;
    rawBookingsByDay[dayOfWeek] = bookingsForDay;

    rows.forEach((row) => {
      allWindowsForWeek.push({
        day: dayOfWeek,
        start: row.startTime,
        end: row.endTime,
        source: "availability",
        availabilityId: row.id,
      });
    });

    defaultSchedule.availability.forEach((scheduleAvailability) => {
      if (!scheduleAvailability.days.includes(dayOfWeek)) {
        return;
      }

      allWindowsForWeek.push({
        day: dayOfWeek,
        start: scheduleAvailability.startTime,
        end: scheduleAvailability.endTime,
        source: "schedule",
        availabilityId: scheduleAvailability.id,
      });
    });

    const daySummary = summarizeWindowsForDay(allWindowsForWeek, dayOfWeek);
    const totalBookedMinutes = bookingsForDay.reduce((acc, bookingItem) => {
      return acc + dayjs(bookingItem.endTime).diff(dayjs(bookingItem.startTime), "minute");
    }, 0);

    summaryByDay.push({
      day: dayOfWeek,
      dayLabel: getSmartWeekdayName(dayOfWeek),
      date: dayDate.format("YYYY-MM-DD"),
      totalMinutes: daySummary.totalMinutes,
      totalHoursLabel: getHourLabelFromMinutes(daySummary.totalMinutes),
      totalBookedMinutes,
      bookingCount: bookingsForDay.length,
      windows: daySummary.windows,
    });
  }

  let totalMinutes = 0;
  let activeDays = 0;
  const dataFingerprintBase = JSON.stringify(rawAvailabilityByDay) + JSON.stringify(rawBookingsByDay);
  let dataFingerprint = 0;
  for (let j = 0; j < summaryByDay.length; j++) {
    totalMinutes += summaryByDay[j].totalMinutes;
    if (summaryByDay[j].totalMinutes > 0) {
      activeDays++;
    }
  }

  for (let k = 0; k < dataFingerprintBase.length; k++) {
    dataFingerprint += dataFingerprintBase.charCodeAt(k);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    userId: ctx.user.id,
    userName: ctx.user.name,
    userEmail: ctx.user.email,
    range: {
      start: startOfWeek.toISOString(),
      end: endOfWeek.toISOString(),
    },
    timeZone: guessedTimeZone,
    totalMinutes,
    totalHoursLabel: getHourLabelFromMinutes(totalMinutes),
    activeDays,
    days: summaryByDay,
    rawAvailability: input.includeRawAvailability ? allWindowsForWeek : undefined,
    rawAvailabilityByDay: input.includeRawAvailability ? rawAvailabilityByDay : undefined,
    rawBookingsByDay,
    internal: {
      cacheKey,
      scheduleId: defaultSchedule.id,
      scheduleName: defaultSchedule.name,
      dataFingerprint,
      cacheSize: smartAvailabilitySummaryCache.size,
      nowAtTimeZone,
    },
  };

  smartAvailabilitySummaryCache.set(cacheKey, {
    expiresAt: Date.now() + SMART_AVAILABILITY_CACHE_TTL_MS,
    value: payload,
  });

  log.debug("Smart availability summary generated", {
    userId: ctx.user.id,
    timeZone: guessedTimeZone,
    activeDays,
    totalMinutes,
  });

  return payload;
};
