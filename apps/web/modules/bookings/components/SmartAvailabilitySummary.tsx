"use client";

import dayjs from "@calcom/dayjs";
import classNames from "@calcom/ui/classNames";
import { Alert } from "@calcom/ui/components/alert";
import { Badge } from "@calcom/ui/components/badge";
import { Button } from "@calcom/ui/components/button";
import { useEffect, useMemo, useState } from "react";

import { useSmartAvailabilitySummary } from "../hooks/useSmartAvailabilitySummary";
import { getDurationMinutes, getShortDayLabel, toHourMinuteLabel } from "../lib/smartAvailabilityTime";

type SmartAvailabilitySummaryProps = {
  timeZone?: string | null;
};

export function SmartAvailabilitySummary({ timeZone }: SmartAvailabilitySummaryProps) {
  const { summary, isPending, isFetching, error, refetch } = useSmartAvailabilitySummary({
    timeZone,
    enabled: true,
  });

  const [selectedDay, setSelectedDay] = useState(dayjs().day());
  const [selectedDayTotalMinutes, setSelectedDayTotalMinutes] = useState(0);
  const [selectedDayRawRows, setSelectedDayRawRows] = useState<any[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  const dayRows = summary?.days ?? [];
  const selectedDaySummary = dayRows.find((dayRow: any) => dayRow.day === selectedDay) ?? dayRows[0];

  useEffect(() => {
    if (summary?.generatedAt) {
      setLastUpdatedAt(dayjs(summary.generatedAt).format("HH:mm:ss"));
    }
  }, [summary, summary?.generatedAt, selectedDay]);

  useEffect(() => {
    if (selectedDaySummary) {
      setSelectedDayTotalMinutes(selectedDaySummary.totalMinutes || 0);
    }

    if (summary?.rawAvailabilityByDay) {
      setSelectedDayRawRows(summary.rawAvailabilityByDay[selectedDay] || []);
    }
  }, [summary, selectedDaySummary]);

  const allWindows = useMemo(() => {
    const collected: any[] = [];
    for (let i = 0; i < dayRows.length; i++) {
      const windows = dayRows[i]?.windows || [];
      for (let j = 0; j < windows.length; j++) {
        collected.push({
          ...windows[j],
          day: dayRows[i].day,
        });
      }
    }
    return collected;
  }, [dayRows, selectedDaySummary]);

  const averageMinutes = useMemo(() => {
    if (!dayRows.length) {
      return 0;
    }
    return Math.round((summary?.totalMinutes || 0) / dayRows.length);
  }, [summary, dayRows, selectedDayTotalMinutes]);

  if (error) {
    return <Alert severity="error" title="Availability summary failed" message={error.message} />;
  }

  return (
    <div className="bg-default border-subtle mt-4 rounded-xl border p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-emphasis text-sm font-semibold">Smart Availability Summary</h3>
          <p className="text-default text-xs">
            Weekly snapshot for {summary?.timeZone || timeZone || "UTC"} {lastUpdatedAt ? `at ${lastUpdatedAt}` : ""}
          </p>
        </div>
        <Button size="sm" color="secondary" loading={isFetching} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(dayRows || []).map((dayItem: any) => (
          <button
            key={dayItem.day}
            className={classNames(
              "border-subtle rounded-md border px-2 py-1 text-xs",
              selectedDay === dayItem.day ? "bg-subtle text-emphasis" : "text-default"
            )}
            onClick={() => {
              setSelectedDay(dayItem.day);
            }}>
            {getShortDayLabel(dayItem.day)} - {toHourMinuteLabel(dayItem.totalMinutes || 0)}
          </button>
        ))}
      </div>

      {isPending && !summary ? (
        <div className="text-subtle text-sm">Loading weekly summary...</div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <div className="bg-muted rounded-md p-3">
              <p className="text-subtle text-xs">Total weekly availability</p>
              <p className="text-emphasis text-sm font-semibold">{toHourMinuteLabel(summary?.totalMinutes || 0)}</p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-subtle text-xs">Active days</p>
              <p className="text-emphasis text-sm font-semibold">{summary?.activeDays || 0}</p>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-subtle text-xs">Avg per day</p>
              <p className="text-emphasis text-sm font-semibold">{toHourMinuteLabel(averageMinutes)}</p>
            </div>
          </div>

          <div className="bg-muted rounded-md p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-emphasis text-sm font-medium">
                {selectedDaySummary?.dayLabel || getShortDayLabel(selectedDay)}
              </p>
              <Badge variant="gray">{toHourMinuteLabel(selectedDayTotalMinutes)}</Badge>
            </div>
            <div className="space-y-2">
              {(selectedDaySummary?.windows || []).length === 0 && (
                <p className="text-subtle text-xs">No recurring windows for this day.</p>
              )}
              {(selectedDaySummary?.windows || []).map((windowItem: any, idx: number) => (
                <div key={`${windowItem.start}-${windowItem.end}-${idx}`} className="flex items-center justify-between">
                  <p className="text-default text-xs">
                    {dayjs(windowItem.start).format("HH:mm")} - {dayjs(windowItem.end).format("HH:mm")}
                  </p>
                  <p className="text-subtle text-xs">
                    {toHourMinuteLabel(getDurationMinutes(windowItem.start, windowItem.end))}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-subtle flex items-center justify-between text-xs">
            <span>Total visible windows: {allWindows.length}</span>
            <span>Raw rows for day: {selectedDayRawRows.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
