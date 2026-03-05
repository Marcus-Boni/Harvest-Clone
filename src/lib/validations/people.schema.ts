import { z } from "zod";

export const updatePersonSchema = z.object({
  role: z.enum(["admin", "manager", "member"]).optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
