/**
 * Firestore collection name constants.
 * ARCH: Centralized collection names to avoid typos and enable easy renaming.
 */
export const COLLECTIONS = {
  TIME_ENTRIES: "time_entries",
  PROJECTS: "projects",
  TIMESHEETS: "timesheets",
  USERS: "users",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
