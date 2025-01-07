import { z } from "zod";

export const Task = z.object({
  id: z.string().openapi({ example: "AbcDex"}),
  name: z.string().openapi({ example: "lorem" }),
  slug: z.string(),
  description: z.string().optional(),
  completed: z.boolean().default(false).optional(),
  due_date: z.string().optional(),
});

export const taskCreateSchema = Task.omit({
  id: true,
})

export type TaskCreateSchema = z.output<typeof taskCreateSchema>

export const taskSelectSchema = Task
