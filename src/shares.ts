import { and, eq, gt, isNull } from 'drizzle-orm'
import { DrizzleD1Database } from 'drizzle-orm/d1'
import dayjs from 'dayjs'

import { files } from '../data/schemas'
import { getFile } from './files/fileShareCodeFetch'

const DOWNLOAD_GRANT_PREFIX = 'download:'
const DOWNLOAD_GRANT_TTL_SECONDS = 5 * 60

export interface DownloadGrant {
  fileId: string
}

export class ShareError extends Error {}

export function isDownloadGrant(
  value: unknown,
  fileId: string,
): value is DownloadGrant {
  return (
    typeof value === 'object' &&
    value !== null &&
    'fileId' in value &&
    (value as DownloadGrant).fileId === fileId
  )
}

export async function lookupShare(
  db: DrizzleD1Database,
  kv: KVNamespace,
  code: string,
) {
  const file = await getFile(db, code)
  if (!file) throw new ShareError('分享码无效')
  if (dayjs(file.due_date).isBefore(dayjs())) {
    throw new ShareError('分享已过期')
  }

  if (file.is_ephemeral) {
    const now = new Date()
    const claimed = await db
      .update(files)
      .set({ claimed_at: now, due_date: new Date(0) })
      .where(
        and(
          eq(files.id, file.id),
          isNull(files.claimed_at),
          gt(files.due_date, now),
        ),
      )
      .returning({ id: files.id })
    if (!claimed.length) throw new ShareError('分享已被读取')
  }

  const token = crypto.randomUUID()
  await kv.put(
    DOWNLOAD_GRANT_PREFIX + token,
    JSON.stringify({ fileId: file.id }),
    {
      expirationTtl: DOWNLOAD_GRANT_TTL_SECONDS,
    },
  )
  return { file, token }
}

export async function resolveDownloadGrant(
  db: DrizzleD1Database,
  kv: KVNamespace,
  token: string,
  fileId: string,
) {
  const grant = await kv.get<unknown>(DOWNLOAD_GRANT_PREFIX + token, 'json')
  if (!isDownloadGrant(grant, fileId)) {
    throw new ShareError('无效的 token')
  }
  const [file] = await db.select().from(files).where(eq(files.id, fileId))
  if (!file) throw new ShareError('无效的 object id')
  return file
}

export async function consumeDownloadGrant(kv: KVNamespace, token: string) {
  await kv.delete(DOWNLOAD_GRANT_PREFIX + token)
}
