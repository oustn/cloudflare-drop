import { z } from 'zod'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema,
} from 'drizzle-zod'
import { createId } from '@paralleldrive/cuid2'

export const files = sqliteTable('files', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  objectId: text('object_id').notNull(), // 文件 id
  filename: text('filename'), // 文件名
  type: text('type'), // 类型
  hash: text('hash').notNull(), // hash 值
  code: text('code').notNull().unique(), // 分享码
  due_date: integer('due_date', { mode: 'timestamp' }).notNull(), // 过期时间
})

export const fileSelectSchema = createSelectSchema(files)

export const fileInsertSchema = createInsertSchema(files)

export const fileUpdateSchema = createUpdateSchema(files)

export type SelectFileType = z.output<typeof fileSelectSchema>

export type InsertFileType = z.output<typeof fileInsertSchema>

export type UpdateFileType = z.output<typeof fileUpdateSchema>
