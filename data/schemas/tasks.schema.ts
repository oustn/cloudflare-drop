import { z } from 'zod'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createSelectSchema, createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { createId } from '@paralleldrive/cuid2'

export const tasks = sqliteTable('tasks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  due_date: integer('due_date', { mode: 'timestamp' }),
})

export const taskSelectSchema = createSelectSchema(tasks)

export const taskInsertSchema = createInsertSchema(tasks)

export const taskUpdateSchema = createUpdateSchema(tasks)

export type SelectTaskType = z.output<typeof taskSelectSchema>

export type InsertTaskType = z.output<typeof taskInsertSchema>

export type UpdateTaskType = z.output<typeof taskUpdateSchema>
