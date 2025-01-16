import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Pavadinimas yra privalomas"),
  description: z.string().optional(),
  priority: z.coerce.number().min(1).max(5).default(1),
  deadline: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;