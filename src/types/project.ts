export type ProjectStatus = "active" | "archived" | "completed";

export interface Project {
  id: string;
  name: string;
  /** Short code for identification, e.g. "OPT-001" */
  code: string;
  clientName?: string;
  /** Hex color for visual identification in UI */
  color: string;
  description?: string;
  status: ProjectStatus;
  billable: boolean;
  /** Budget in hours */
  budget?: number;
  /** Azure DevOps project ID for integration */
  azureProjectId?: string;
  memberIds: string[];
  managerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Minimal project info for selects and quick display */
export interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  color: string;
  clientName?: string;
}

/** Project with computed usage stats */
export interface ProjectWithStats extends Project {
  totalHoursUsed: number;
  memberCount: number;
  budgetPercentage?: number;
}
