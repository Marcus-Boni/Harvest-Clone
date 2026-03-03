/** ARCH: User roles determine access levels across the application */
export type UserRole = "member" | "manager" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  department?: string;
  managerId?: string;
  /** Hourly rate for cost calculations — visible to managers only */
  hourlyRate?: number;
  /** Azure AD Object ID for SSO integration */
  azureId?: string;
  /** Expected weekly hours (default: 40) */
  weeklyCapacity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Minimal user info for display in lists and cards */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
}
