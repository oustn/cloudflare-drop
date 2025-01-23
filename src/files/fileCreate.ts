import { Context } from 'hono'
import mine from 'mime'
import { createId, init } from '@paralleldrive/cuid2'
import { Endpoint } from '../endpoint'
import { z } from 'zod'
import dayjs from 'dayjs'

import { files, InsertFileType } from '../../data/schemas'

async function sha1(data: ArrayBuffer) {
  const digest = await crypto.subtle.digest(
    {
      name: 'SHA-1',
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

  async handle(c: Context) {
    let data: ArrayBuffer | null = null
    let filename: string
    let type: string | null
    // let size: number = 0
    const contentType = c.req.header('Content-Type')
    if (
      contentType?.startsWith('multipart/form-data') ||
      contentType?.startsWith('application/x-www-form-urlencoded')
    ) {
      const formData = await c.req.formData()
      const file = formData.get('file') as File
      data = await file.arrayBuffer()
      filename = file.name
      type = file.type ?? mine.getType(filename) ?? 'text/plain'
      // size = file.size
    } else {
      const blob = await c.req.blob()
      data = await blob.arrayBuffer()
      filename = (blob as File)?.name ?? ''
      type = blob.type
      // size = blob.size
    }

    if (!data || data.byteLength === 0) {
      return this.error('File data missing')
    }

    const kv = this.getKV(c)
    const key = createId()
    await kv.put(key, data)
    const hash = await sha1(data)

    const db = this.getDB(c)
    // todo 共享码冲突
    const shareCode = init({
      length: 6,
    })().toUpperCase()

    const dueDate = dayjs().add(1, 'hour').toDate()

    const insert: InsertFileType = {
      objectId: key,
      filename,
      type,
      hash,
      code: shareCode,
      due_date: dueDate,
    }

    const [record] = await db.insert(files).values(insert).returning({
      hash: files.hash,
      code: files.code,
      due_date: files.due_date,
    })

    return {
      message: 'ok',
      result: true,
      data: record,
    }
  }
}
