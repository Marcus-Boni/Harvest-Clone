"use client";

import type {
  TimeSubmitModePreference,
  TimeViewPreference,
  User,
} from "@/types/user";

export interface TimePreferences {
  defaultView: TimeViewPreference;
  lastProjectId: string | null;
  defaultBillable: boolean;
  defaultDuration: number;
  submitMode: TimeSubmitModePreference;
  assistantEnabled: boolean;
  outlookDrawerDefaultOpen: boolean;
  showWeekends: boolean;
}

const STORAGE_KEY = "harvest:time-preferences";

export const DEFAULT_TIME_PREFERENCES: TimePreferences = {
  defaultView: "week",
  lastProjectId: null,
  defaultBillable: true,
  defaultDuration: 60,
  submitMode: "close",
  assistantEnabled: true,
  outlookDrawerDefaultOpen: false,
  showWeekends: true,
};

export function getTimePreferences(): TimePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_TIME_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_TIME_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<TimePreferences>;

    return {
      ...DEFAULT_TIME_PREFERENCES,
      ...parsed,
    };
  } catch {
    return DEFAULT_TIME_PREFERENCES;
  }
}

export function saveTimePreference<K extends keyof TimePreferences>(
  key: K,
  value: TimePreferences[K],
): void {
  saveTimePreferences({
    [key]: value,
  } as Partial<TimePreferences>);
}

export function saveTimePreferences(patch: Partial<TimePreferences>): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = getTimePreferences();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...current,
        ...patch,
      }),
    );
  } catch {
    // Ignore unavailable or blocked storage.
  }
}

export function getTimePreferencesFromUser(
  user: Pick<
    User,
    | "timeDefaultBillable"
    | "timeDefaultDuration"
    | "timeDefaultView"
    | "timeSubmitMode"
    | "timeAssistantEnabled"
    | "timeOutlookDefaultOpen"
    | "timeShowWeekends"
  >,
): Partial<TimePreferences> {
  return {
    assistantEnabled: user.timeAssistantEnabled,
    defaultBillable: user.timeDefaultBillable,
    defaultDuration: user.timeDefaultDuration,
    defaultView: user.timeDefaultView,
    outlookDrawerDefaultOpen: user.timeOutlookDefaultOpen,
    showWeekends: user.timeShowWeekends,
    submitMode: user.timeSubmitMode,
  };
}
