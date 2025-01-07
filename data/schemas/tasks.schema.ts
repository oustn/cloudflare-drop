import {integer, sqliteTable, text} from "drizzle-orm/sqlite-core";
import {createId} from '@paralleldrive/cuid2';

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  completed: integer('completed', {mode: 'boolean'}).default(false),
  due_date: integer('due_date', { mode: 'timestamp' })
})
