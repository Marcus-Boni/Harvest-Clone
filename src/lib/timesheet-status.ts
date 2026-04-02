export const LOCKED_TIMESHEET_STATUSES = ["submitted", "approved"] as const;

export function isTimesheetLockedStatus(
  status: string | null | undefined,
): boolean {
  return status === "submitted" || status === "approved";
}

export function isTimesheetEditableStatus(
  status: string | null | undefined,
): boolean {
  return status == null || status === "open" || status === "rejected";
}

export function isTimesheetSubmittableStatus(
  status: string | null | undefined,
): boolean {
  return status === "open" || status === "rejected";
}

export function getTimesheetStatusLabel(
  status: string | null | undefined,
): string {
  switch (status) {
    case "submitted":
      return "submetida";
    case "approved":
      return "aprovada";
    case "rejected":
      return "rejeitada";
    case "open":
      return "aberta";
    default:
      return "indefinida";
  }
}
