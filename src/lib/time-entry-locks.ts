import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { timesheet } from "@/lib/db/schema";
import {
  getTimesheetStatusLabel,
  isTimesheetLockedStatus,
} from "@/lib/timesheet-status";
import { getWeekPeriod } from "@/lib/utils";

export interface WeeklyTimesheetStatusForDate {
  period: string;
  timesheetId: string | null;
  status: string | null;
  locked: boolean;
}

export class LockedTimesheetPeriodError extends Error {
  constructor(
    readonly date: string,
    readonly timesheetStatus: string,
  ) {
    super(
      `Não é possível registrar horas em ${date} porque a semana desse dia já foi ${getTimesheetStatusLabel(timesheetStatus)}.`,
    );
    this.name = "LockedTimesheetPeriodError";
  }
}

export async function getWeeklyTimesheetStatusForDate(
  userId: string,
  date: string,
): Promise<WeeklyTimesheetStatusForDate> {
  const period = getWeekPeriod(date);
  const weeklyTimesheet = await db.query.timesheet.findFirst({
    where: and(
      eq(timesheet.userId, userId),
      eq(timesheet.period, period),
      eq(timesheet.periodType, "weekly"),
    ),
    columns: {
      id: true,
      status: true,
    },
  });

  return {
    period,
    timesheetId: weeklyTimesheet?.id ?? null,
    status: weeklyTimesheet?.status ?? null,
    locked: isTimesheetLockedStatus(weeklyTimesheet?.status),
  };
}

export async function assertWeeklyTimesheetDateUnlocked(
  userId: string,
  date: string,
): Promise<WeeklyTimesheetStatusForDate> {
  const status = await getWeeklyTimesheetStatusForDate(userId, date);

  if (status.status && isTimesheetLockedStatus(status.status)) {
    throw new LockedTimesheetPeriodError(date, status.status);
  }

  return status;
}
