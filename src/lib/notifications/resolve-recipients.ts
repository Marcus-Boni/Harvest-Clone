import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { timesheet, user } from "@/lib/db/schema";

export interface ReminderRecipient {
  id: string;
  name: string;
  email: string;
}

/** Returns current ISO week period string, e.g. "2026-W14" */
export function getISOWeekPeriod(date: Date = new Date()): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = d.getUTCDay() || 7; // ISO: Mon=1 … Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export async function resolveReminderRecipients({
  actorId,
  scope,
  condition,
  userIds,
}: {
  actorId: string;
  scope: "all" | "direct_reports";
  condition: "all" | "not_submitted";
  userIds?: string[];
}): Promise<ReminderRecipient[]> {
  let candidates: ReminderRecipient[];

  if (userIds && userIds.length > 0) {
    // Individual selection: fetch only the specified users
    const rows = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(and(inArray(user.id, userIds), eq(user.isActive, true)));
    candidates = rows;
  } else if (scope === "all") {
    // Admin bulk: all active users
    const rows = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.isActive, true));
    candidates = rows;
  } else {
    // Manager bulk: direct reports only
    const rows = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(and(eq(user.managerId, actorId), eq(user.isActive, true)));
    candidates = rows;
  }

  if (condition !== "not_submitted") {
    return candidates;
  }

  // Filter: keep only users who have NOT submitted their current week timesheet
  const currentPeriod = getISOWeekPeriod();
  const candidateIds = candidates.map((c) => c.id);

  if (candidateIds.length === 0) return [];

  const submittedRows = await db
    .select({ userId: timesheet.userId })
    .from(timesheet)
    .where(
      and(
        inArray(timesheet.userId, candidateIds),
        eq(timesheet.period, currentPeriod),
        inArray(timesheet.status, ["submitted", "approved"] as string[]),
      ),
    );

  const submittedUserIds = new Set(submittedRows.map((r) => r.userId));
  return candidates.filter((c) => !submittedUserIds.has(c.id));
}
