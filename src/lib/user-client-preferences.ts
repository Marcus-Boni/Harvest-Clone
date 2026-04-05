"use client";

import {
  getTimePreferencesFromUser,
  saveTimePreferences,
} from "@/lib/time-preferences";
import type { User } from "@/types/user";

type SyncableUserPreferences = Pick<
  User,
  | "timeAssistantEnabled"
  | "timeDefaultBillable"
  | "timeDefaultDuration"
  | "timeDefaultView"
  | "timeOutlookDefaultOpen"
  | "timeShowWeekends"
  | "timeSubmitMode"
>;

export function syncUserClientPreferences(user: SyncableUserPreferences): void {
  saveTimePreferences(getTimePreferencesFromUser(user));
}
