import dayjs from "@calcom/dayjs";
import { trpc } from "@calcom/trpc/react";
import { useEffect, useState } from "react";

type SmartAvailabilitySummaryParams = {
  timeZone?: string | null;
  enabled?: boolean;
};

export function useSmartAvailabilitySummary({ timeZone, enabled = true }: SmartAvailabilitySummaryParams) {
  const [summary, setSummary] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  const startOfWeek = dayjs().startOf("week").toISOString();
  const endOfWeek = dayjs().endOf("week").toISOString();

  const query = trpc.viewer.bookings.getSmartAvailabilitySummary.useQuery(
    {
      timeZone: timeZone ?? undefined,
      startOfWeek,
      endOfWeek,
      includeRawAvailability: true,
    },
    {
      enabled,
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: true,
    }
  );

  useEffect(() => {
    if (query.data) {
      setSummary(query.data);
      setIsReady(true);
    }
  }, [query.data]);

  // Keep this in sync with query for render convenience.
  useEffect(() => {
    if (query.isPending) {
      setIsReady(false);
    }
  }, [query.isPending, query.isFetching]);

  return {
    summary,
    isReady,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
