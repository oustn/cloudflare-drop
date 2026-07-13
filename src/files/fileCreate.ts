import { Context } from 'hono'
import mine from 'mime'
import { createId, init } from '@paralleldrive/cuid2'
import { z } from 'zod'
import dayjs, { ManipulateType } from 'dayjs'
import { inArray } from 'drizzle-orm'

import { Endpoint } from '../endpoint'
import { files, InsertFileType } from '../../data/schemas'
import { MAX_DURATION } from '../common'

const duration = ['day', 'week', 'month', 'year', 'hour', 'minute']

function resolveDuration(str: string): [number, ManipulateType] {
  const match = new RegExp(`^(\\d+)(${duration.join('|')})$`).exec(str)
  if (!match) {
    return [1, 'hour']
  }
  return [Number.parseInt(match[1], 10), match[2] as ManipulateType]
}

function numberRandom() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sha256(data: ArrayBuffer) {
  const digest = await crypto.subtle.digest(
    {
      name: 'SHA-256',
    },
    data,
  )
  const array = Array.from(new Uint8Array(digest))
  return array.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export class FileCreate extends Endpoint {
  schema = {
    responses: {
      '200': {
        description: 'Returns the file info',

        content: {
          'application/json': {
            schema: z.object({
              hash: z.string(),
            }),
          },
        },
      },
    },
  }

  private getFormDataField<T>(
    formData: FormData,
    fieldName: string,
    defaultValue: T,
  ): T {
    const value = formData.get(fieldName) as string
    if (!value) return defaultValue
    try {
      return JSON.parse(value)
    } catch (_e) {
      //
    }
    return defaultValue
  }

  async handle(c: Context) {
    let data: ArrayBuffer | null = null
    let filename: string = ''
    let type: string | null = null
    let size: number = 0
    let duration: string = c.env.SHARE_DURATION
    let isEphemeral = false
    let isEncrypted = false
    let objectId: string | Array<{ objectId: string }> = ''
    let hash = ''
    const contentType = c.req.header('Content-Type')
    if (
      contentType?.startsWith('multipart/form-data') ||
      contentType?.startsWith('application/x-www-form-urlencoded')
    ) {
      const formData = await c.req.formData()
      const file = formData.get('file') as File

      const fileInfo = this.getFormDataField<null | {
        objectId: string | Array<{ objectId: string }>
        name: string
        type?: string
        size: number
        sha: string
      }>(formData, 'fileInfo', null)

      duration = this.getFormDataField(formData, 'duration', duration)
      isEphemeral = this.getFormDataField(formData, 'isEphemeral', isEphemeral)
      isEncrypted = this.getFormDataField(formData, 'isEncrypted', isEncrypted)

      if (file) {
        data = await file.arrayBuffer()
        filename = file.name
        type = file.type ?? mine.getType(filename) ?? 'text/plain'
        size = file.size
      } else if (fileInfo) {
        filename = fileInfo.name
        type = fileInfo.type ?? mine.getType(filename) ?? 'text/plain'
        size = fileInfo.size
        objectId = fileInfo.objectId
        hash = fileInfo.sha
      }
    } else {
      const blob = await c.req.blob()
      data = await blob.arrayBuffer()
      filename = (blob as File)?.name ?? ''
      type = blob.type
      size = blob.size
    }

    if (
      (!data || data.byteLength === 0) &&
      (!objectId || (Array.isArray(objectId) && !objectId.length))
    ) {
      return this.error('EMPTY_CONTENT')
    }

    const envMax = Number.parseInt(c.env.SHARE_MAX_SIZE_IN_MB, 10)
    const max = Number.isNaN(envMax) || envMax <= 0 ? 10 : envMax

    if (size > max * 1000 * 1000) {
      return this.error('FILE_TOO_LARGE')
    }

    const kv = this.getKV(c)
    const key = objectId && !Array.isArray(objectId) ? objectId : createId()
    // 直接上傳
    if (data && data.byteLength) {
      await kv.put(key, data)
      hash = await sha256(data)
      // 單一物件
    } else if (typeof objectId === 'string') {
      const cacheFile = await kv.get(objectId, 'stream')
      if (!cacheFile) {
        return this.error('CHUNK_NOT_FOUND')
      }
      // 分片儲存
    } else if (Array.isArray(objectId) && objectId.length) {
      await kv.put(key, 'chunks', {
        metadata: objectId,
      })
    }

    const db = this.getDB(c)

    const shareCodeCreate = init({
      length: 6,
    })

    const shareCodes: Array<string> = [
      ...new Array(20).fill(1).map(() => numberRandom()),
      ...new Array(10).fill(1).map(() => shareCodeCreate().toUpperCase()),
    ]

    const records = (
      await db
        .select({
          code: files.code,
        })
        .from(files)
        .where(inArray(files.code, shareCodes))
    ).map((d) => d.code)

    const shareCode = shareCodes.find((d) => !records.includes(d))

    if (!shareCode) {
      return this.error('CODE_GENERATION_FAILED')
    }

    const [due, dueType] = resolveDuration(duration || c.env.SHARE_DURATION)
    const forever = due === 999 && dueType === 'year'
    const dueDate = forever
      ? MAX_DURATION.toDate()
      : dayjs().add(due, dueType).toDate()

    const insert: InsertFileType = {
      objectId: key,
      filename,
      type,
      hash,
      code: shareCode,
      due_date: dueDate,
      size,
      is_ephemeral: isEphemeral,
      is_encrypted: isEncrypted,
      created_at: dayjs().toDate(),
    }

    const [record] = await db.insert(files).values(insert).returning({
      hash: files.hash,
      code: files.code,
      due_date: files.due_date,
      is_ephemeral: files.is_ephemeral,
      is_encrypted: files.is_encrypted,
    })

    return {
      message: 'ok',
      result: true,
      data: {
        ...record,
        due_date: forever ? null : record.due_date,
      },
    }
  }
}
