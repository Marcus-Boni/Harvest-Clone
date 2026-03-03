import { z } from "zod";

/** Validation schema for creating/editing a time entry */
export const timeEntrySchema = z.object({
  projectId: z.string().min(1, "Selecione um projeto"),
  taskId: z.string().optional(),
  taskTitle: z.string().optional(),
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .max(500, "Máximo de 500 caracteres"),
  date: z.string().min(1, "Data é obrigatória"),
  duration: z
    .number()
    .min(1, "Duração mínima de 1 minuto")
    .max(1440, "Duração máxima de 24 horas"),
  billable: z.boolean().default(true),
  azureWorkItemId: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

export type TimeEntryFormData = z.infer<typeof timeEntrySchema>;

/** Quick entry — simplified form for fast time logging */
export const quickEntrySchema = z.object({
  projectId: z.string().min(1, "Selecione um projeto"),
  hours: z
    .number()
    .min(0.25, "Mínimo de 15 minutos")
    .max(24, "Máximo de 24 horas"),
  description: z.string().min(1, "Descrição é obrigatória"),
});

export type QuickEntryFormData = z.infer<typeof quickEntrySchema>;
