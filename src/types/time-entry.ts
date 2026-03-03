export type TimeEntryStatus = "draft" | "submitted" | "approved" | "rejected";

export interface TimeEntry {
  id: string;
  userId: string;
  userDisplayName: string;
  projectId: string;
  projectName: string;
  /** Azure DevOps Work Item ID */
  taskId?: string;
  taskTitle?: string;
  description: string;
  /** Date of the entry (YYYY-MM-DD) */
  date: Date;
  /** Start time for live timer entries */
  startTime?: Date;
  /** End time for live timer entries */
  endTime?: Date;
  /** Total duration in minutes */
  duration: number;
  billable: boolean;
  status: TimeEntryStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  azureWorkItemId?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Payload for creating a new time entry */
export interface CreateTimeEntryPayload {
  projectId: string;
  taskId?: string;
  taskTitle?: string;
  description: string;
  date: string;
  duration: number;
  billable: boolean;
  azureWorkItemId?: number;
  tags?: string[];
}

/** Payload for updating a time entry */
export interface UpdateTimeEntryPayload
  extends Partial<CreateTimeEntryPayload> {
  id: string;
}

/** Grouped time entries by date for timesheet display */
export interface DailyTimeEntries {
  date: string;
  entries: TimeEntry[];
  totalMinutes: number;
}
