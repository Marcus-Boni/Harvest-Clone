import { z } from "zod";

export const azureDevopsConfigSchema = z.object({
  organizationUrl: z
    .string()
    .trim()
    .url("A URL da organização deve ser válida.")
    .min(1, "URL da organização e obrigatória."),
  pat: z.string().trim().min(1, "O Personal Access Token (PAT) e obrigatório."),
  commitAuthor: z
    .string()
    .trim()
    .min(1, "Informe o e-mail ou usuário usado nos commits do Azure DevOps."),
});

export type AzureDevopsConfigInput = z.infer<typeof azureDevopsConfigSchema>;
