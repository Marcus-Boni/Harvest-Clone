"use client";

export const TIME_ENTRIES_UPDATED_EVENT = "time-entries:updated";
export const TIMER_UPDATED_EVENT = "timer:updated";
export const TIMESHEETS_UPDATED_EVENT = "timesheets:updated";

export function dispatchTimeEntriesUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TIME_ENTRIES_UPDATED_EVENT));
}

export function dispatchTimerUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TIMER_UPDATED_EVENT));
}

export function dispatchTimesheetsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TIMESHEETS_UPDATED_EVENT));
}
