import { getStoredApiUrl, getStoredToken } from "./auth";
import type {
  ActiveTimer,
  ExtensionUser,
  Project,
  WorkItemTimeData,
  TimeEntry,
} from "./types";

function apiUrl(path: string): string {
  const base = getStoredApiUrl() ?? "";
  return `${base}${path}`;
}

function authHeaders(): HeadersInit {
  const token = getStoredToken() ?? "";
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function getMe(): Promise<ExtensionUser> {
  return apiFetch<ExtensionUser>("/api/extension/me");
}

// ── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const data = await apiFetch<{ projects: Project[] }>("/api/extension/projects");
  return data.projects;
}

// ── Work Item Time Entries ────────────────────────────────────────────────────

export async function getWorkItemTimeEntries(
  workItemId: number,
): Promise<WorkItemTimeData> {
  return apiFetch<WorkItemTimeData>(
    `/api/extension/work-items/${workItemId}/time-entries`,
  );
}

// ── Time Entry ────────────────────────────────────────────────────────────────

export interface CreateTimeEntryPayload {
  projectId: string;
  description: string;
  date: string;
  duration: number;
  billable: boolean;
  azureWorkItemId?: number;
  azureWorkItemTitle?: string;
}

export async function createTimeEntry(
  payload: CreateTimeEntryPayload,
): Promise<TimeEntry> {
  const data = await apiFetch<{ entry: TimeEntry }>("/api/extension/time-entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.entry;
}

// ── Timer ─────────────────────────────────────────────────────────────────────

export async function getTimer(): Promise<ActiveTimer | null> {
  const data = await apiFetch<{ timer: ActiveTimer | null }>("/api/extension/timer");
  return data.timer;
}

export interface StartTimerPayload {
  action: "start";
  projectId: string;
  description?: string;
  billable?: boolean;
  azureWorkItemId?: number;
  azureWorkItemTitle?: string;
}

export async function startTimer(
  payload: Omit<StartTimerPayload, "action">,
): Promise<ActiveTimer> {
  const data = await apiFetch<{ timer: ActiveTimer }>("/api/extension/timer", {
    method: "POST",
    body: JSON.stringify({ action: "start", ...payload }),
  });
  return data.timer;
}

export async function stopTimer(): Promise<TimeEntry> {
  const data = await apiFetch<{ entry: TimeEntry }>("/api/extension/timer", {
    method: "POST",
    body: JSON.stringify({ action: "stop" }),
  });
  return data.entry;
}
