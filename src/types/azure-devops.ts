export type WorkItemType = "Bug" | "Task" | "User Story" | "Feature" | "Epic";
export type WorkItemState =
  | "New"
  | "Active"
  | "Resolved"
  | "Closed"
  | "Removed";

export interface AzureDevOpsWorkItem {
  id: number;
  title: string;
  type: WorkItemType;
  state: WorkItemState;
  assignedTo?: string;
  projectName: string;
  areaPath: string;
  iterationPath: string;
  /** Remaining work in hours */
  remainingWork?: number;
  /** Completed work in hours */
  completedWork?: number;
  /** Original estimate in hours */
  originalEstimate?: number;
  url: string;
}

export interface AzureDevOpsProject {
  id: string;
  name: string;
  description?: string;
  url: string;
  state: string;
}

export interface AzureDevOpsConfig {
  organizationUrl: string;
  /** Personal Access Token or OAuth token */
  accessToken: string;
  defaultProjectId?: string;
}

/** Search result for work item autocomplete */
export interface WorkItemSearchResult {
  id: number;
  title: string;
  type: WorkItemType;
  state: WorkItemState;
  projectName: string;
}
