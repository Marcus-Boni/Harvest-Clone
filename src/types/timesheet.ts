export type TimesheetStatus = "open" | "submitted" | "approved" | "rejected";
export type TimesheetPeriodType = "weekly" | "monthly";

export interface Timesheet {
  id: string;
  userId: string;
  /** Period identifier, e.g. "2025-W01" or "2025-01" */
  period: string;
  periodType: TimesheetPeriodType;
  totalHours: number;
  billableHours: number;
  status: TimesheetStatus;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  entryIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Summary for manager approval view */
export interface TimesheetApprovalItem {
  timesheet: Timesheet;
  userName: string;
  userAvatar?: string;
  projectBreakdown: {
    projectName: string;
    projectColor: string;
    hours: number;
  }[];
}
