import { getStoredApiUrl, getStoredToken } from "./auth";
import { resolveSchedulingHours, toNumericHours } from "./scheduling";
import type {
  ActiveTimer,
  ExtensionUser,
  Project,
  TimeEntry,
  WorkItemTimeData,
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
  const method = (init?.method ?? "GET").toUpperCase();
  const isGet = method === "GET";

  const res = await fetch(apiUrl(path), {
    ...init,
    method,
    cache: isGet ? "no-store" : init?.cache,
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
  const data = await apiFetch<{ projects: Project[] }>(
    "/api/extension/projects",
  );
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
  const data = await apiFetch<{ entry: TimeEntry }>(
    "/api/extension/time-entries",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return data.entry;
}

// ── Timer ─────────────────────────────────────────────────────────────────────

export async function getTimer(): Promise<ActiveTimer | null> {
  const data = await apiFetch<{ timer: ActiveTimer | null }>(
    "/api/extension/timer",
  );
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

// ── Azure DevOps Work Item Field Sync ────────────────────────────────────────

/**
 * IWorkItemFormService subset — only the methods we actually use.
 * Keeps the type compatible with the real SDK without importing it.
 */
export interface IFormServiceSubset {
  getId: () => Promise<number>;
  getFieldValue: (
    field: string,
    options?: { returnOriginalValue: boolean },
  ) => Promise<unknown>;
  getFieldValues?: (
    fields: string[],
    options?: { returnOriginalValue: boolean },
  ) => Promise<Record<string, unknown>>;
  setFieldValue: (field: string, value: unknown) => Promise<void>;
  setFieldValues?: (fields: Record<string, unknown>) => Promise<unknown>;
  /** Available in newer SDK versions — gracefully skipped if absent */
  save?: () => Promise<void>;
}

export interface WorkItemFieldUpdate {
  completedWork: number; // hours
  remainingWork: number; // hours
  saved: boolean; // whether save() was called successfully
}

/**
 * Reads current Completed Work & Remaining Work from the DevOps form service,
 * applies the delta for a new time entry of `durationMinutes`, writes back the
 * updated values, and then saves the work item.
 *
 * NOTE: `setFieldValue` only marks fields as dirty in the extension panel.
 * Calling `save()` persists the changes to Azure DevOps immediately.
 *
 * @param formService - IWorkItemFormService (or compatible subset) from the DevOps SDK
 * @param durationMinutes - duration of the new entry being saved
 */
export async function syncWorkItemFields(
  formService: IFormServiceSubset,
  durationMinutes: number,
): Promise<WorkItemFieldUpdate> {
  const durationHours = durationMinutes / 60;
  const fieldNames = [
    "Microsoft.VSTS.Scheduling.CompletedWork",
    "Microsoft.VSTS.Scheduling.RemainingWork",
    "Microsoft.VSTS.Scheduling.OriginalEstimate",
  ];
  const fieldValues = formService.getFieldValues
    ? await formService.getFieldValues(fieldNames, {
        returnOriginalValue: false,
      })
    : {
        "Microsoft.VSTS.Scheduling.CompletedWork":
          await formService.getFieldValue(
            "Microsoft.VSTS.Scheduling.CompletedWork",
            {
              returnOriginalValue: false,
            },
          ),
        "Microsoft.VSTS.Scheduling.RemainingWork":
          await formService.getFieldValue(
            "Microsoft.VSTS.Scheduling.RemainingWork",
            {
              returnOriginalValue: false,
            },
          ),
        "Microsoft.VSTS.Scheduling.OriginalEstimate":
          await formService.getFieldValue(
            "Microsoft.VSTS.Scheduling.OriginalEstimate",
            {
              returnOriginalValue: false,
            },
          ),
      };

  const currentCompleted = toNumericHours(
    fieldValues["Microsoft.VSTS.Scheduling.CompletedWork"],
  );
  const updatedFields = resolveSchedulingHours({
    completedWork: fieldValues["Microsoft.VSTS.Scheduling.CompletedWork"],
    remainingWork: fieldValues["Microsoft.VSTS.Scheduling.RemainingWork"],
    originalEstimate: fieldValues["Microsoft.VSTS.Scheduling.OriginalEstimate"],
    nextCompletedWork: currentCompleted + durationHours,
  });

  if (formService.setFieldValues) {
    await formService.setFieldValues({
      "Microsoft.VSTS.Scheduling.CompletedWork": updatedFields.completedWork,
      "Microsoft.VSTS.Scheduling.RemainingWork": updatedFields.remainingWork,
    });
  } else {
    await formService.setFieldValue(
      "Microsoft.VSTS.Scheduling.CompletedWork",
      updatedFields.completedWork,
    );
    await formService.setFieldValue(
      "Microsoft.VSTS.Scheduling.RemainingWork",
      updatedFields.remainingWork,
    );
  }

  // Persist to DevOps — save() is required, setFieldValue alone only marks dirty
  let saved = false;
  if (typeof formService.save === "function") {
    try {
      await formService.save();
      saved = true;
    } catch (saveErr) {
      console.error("[syncWorkItemFields] save() failed:", saveErr);
      // Non-fatal — fields are still dirty in the form, user can manually save
    }
  }

  return {
    completedWork: updatedFields.completedWork,
    remainingWork: updatedFields.remainingWork,
    saved,
  };
}
