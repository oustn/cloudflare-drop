import { drizzle } from 'drizzle-orm/d1'
import { files } from '../data/schemas'
import { asc, eq, lte } from 'drizzle-orm'
import { storageForProvider } from './storage'

const CLEANUP_BATCH_SIZE = 100

export async function scheduled(_event: ScheduledEvent, env: Env) {
  const db = drizzle(env.DB)

  const now = new Date()

  const records = await db
    .select({
      id: files.id,
      objectId: files.objectId,
      storageProvider: files.storage_provider,
    })
    .from(files)
    .where(lte(files.due_date, now))
    .orderBy(asc(files.due_date))
    .limit(CLEANUP_BATCH_SIZE)

  for (const record of records) {
    try {
      await storageForProvider(env, record.storageProvider).delete(
        record.objectId,
      )
      await db.delete(files).where(eq(files.id, record.id))
    } catch (error) {
      console.error(`failed to remove expired share ${record.id}`, error)
    }
  }

  console.log(`clear before ${now}`)
}
