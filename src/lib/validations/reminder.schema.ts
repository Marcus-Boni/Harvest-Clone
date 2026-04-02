import { z } from "zod";

export const sendReminderSchema = z.object({
  userIds: z.array(z.string().min(1)).optional(),
  note: z.string().max(500).optional(),
  scope: z.enum(["all", "direct_reports"]).optional(),
});

export type SendReminderInput = z.infer<typeof sendReminderSchema>;

export const updateScheduleSchema = z.object({
  enabled: z.boolean(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(0).max(7),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  timezone: z.string().min(1).max(100),
  condition: z.enum(["all", "not_submitted"]),
  targetScope: z.enum(["all", "direct_reports"]),
});

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
