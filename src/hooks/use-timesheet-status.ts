"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TIMESHEETS_UPDATED_EVENT } from "@/lib/time-events";
import { isTimesheetLockedStatus } from "@/lib/timesheet-status";

interface TimesheetStatusResponse {
  period: string;
  timesheetId: string | null;
  status: string | null;
  error?: string;
}

interface UseTimesheetStatusOptions {
  enabled?: boolean;
}

interface TimesheetStatusSnapshot {
  checkedDate: string | null;
  period: string | null;
  timesheetId: string | null;
  status: string | null;
  locked: boolean;
}

export function useTimesheetStatus(
  date: string | null | undefined,
  options: UseTimesheetStatusOptions = {},
) {
  const enabled = options.enabled ?? true;
  const requestIdRef = useRef(0);
  const [checkedDate, setCheckedDate] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | null>(null);
  const [timesheetId, setTimesheetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const commitSnapshot = useCallback(
    (
      requestId: number,
      snapshot: TimesheetStatusSnapshot,
      isLoading: boolean,
    ) => {
      if (requestId !== requestIdRef.current) {
        return snapshot;
      }

      setCheckedDate(snapshot.checkedDate);
      setStatus(snapshot.status);
      setPeriod(snapshot.period);
      setTimesheetId(snapshot.timesheetId);
      setLoading(isLoading);
      return snapshot;
    },
    [],
  );

  const fetchStatus = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!enabled || !date) {
      return commitSnapshot(
        requestId,
        {
          checkedDate: null,
          period: null,
          timesheetId: null,
          status: null,
          locked: false,
        },
        false,
      );
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({ date });
      const response = await fetch(
        `/api/timesheets/status?${params.toString()}`,
      );
      const data = (await response.json()) as Partial<TimesheetStatusResponse>;

      if (!response.ok) {
        throw new Error(data.error ?? "Falha ao carregar status do timesheet");
      }

      return commitSnapshot(
        requestId,
        {
          checkedDate: date,
          period: data.period ?? null,
          timesheetId: data.timesheetId ?? null,
          status: data.status ?? null,
          locked: isTimesheetLockedStatus(data.status ?? null),
        },
        false,
      );
    } catch {
      return commitSnapshot(
        requestId,
        {
          checkedDate: date,
          period: null,
          timesheetId: null,
          status: null,
          locked: false,
        },
        false,
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [commitSnapshot, date, enabled]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleUpdated = () => {
      void fetchStatus();
    };

    window.addEventListener(TIMESHEETS_UPDATED_EVENT, handleUpdated);

    return () => {
      window.removeEventListener(TIMESHEETS_UPDATED_EVENT, handleUpdated);
    };
  }, [enabled, fetchStatus]);

  return {
    checkedDate,
    status,
    period,
    timesheetId,
    locked: isTimesheetLockedStatus(status),
    checking: enabled && Boolean(date) && (loading || checkedDate !== date),
    loading,
    refetch: fetchStatus,
  };
}
