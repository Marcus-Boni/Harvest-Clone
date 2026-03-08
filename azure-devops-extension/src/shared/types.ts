export interface ExtensionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface TimeEntryUser {
  id: string;
  name: string;
  image: string | null;
}

export interface TimeEntry {
  id: string;
  date: string;
  duration: number; // minutes
  description: string;
  billable: boolean;
  project: Pick<Project, "id" | "name" | "code" | "color">;
  user: TimeEntryUser;
  isOwn: boolean;
}

export interface WorkItemTimeData {
  workItemId: number;
  totalMinutes: number;
  myMinutes: number;
  entries: TimeEntry[];
}

export interface ActiveTimer {
  id: string;
  projectId: string;
  description: string;
  billable: boolean;
  azureWorkItemId: number | null;
  azureWorkItemTitle: string | null;
  startedAt: string;
  pausedAt: string | null;
  accumulatedMs: number;
  project: Pick<Project, "id" | "name" | "code" | "color">;
}
