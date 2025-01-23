import { drizzle } from 'drizzle-orm/d1'
import { files } from '../data/schemas'
import { lte } from 'drizzle-orm'

export async function scheduled(event: ScheduledEvent, env: Env) {
  const db = drizzle(env.DB)
  const kv = env.file_drops

  const now = new Date()

  const records = await db
    .delete(files)
    .where(lte(files.due_date, now))
    .returning({
      objectId: files.objectId,
    })

  if (records.length) {
    await Promise.all(records.map((d) => kv.delete(d.objectId)))
  }

  console.log(`clear before ${now}`)
}
