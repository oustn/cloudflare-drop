import { Endpoint } from '../endpoint'
import { Context } from 'hono'
import { z } from 'zod'
import { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import dayjs from 'dayjs'
import { createId } from '@paralleldrive/cuid2'

import { files, fileSelectSchema } from '../../data/schemas'
import { MAX_DURATION } from '../common'

export async function getFile(db: DrizzleD1Database, code: string) {
  const [file] = await db
    .select({
      id: files.id,
      code: files.code,
      filename: files.filename,
      hash: files.hash,
      due_date: files.due_date,
      type: files.type,
      objectId: files.objectId,
      size: files.size,
      is_ephemeral: files.is_ephemeral,
      is_encrypted: files.is_encrypted,
    })
    .from(files)
    .where(eq(files.code, code.toUpperCase()))

  return file
}

export class FileShareCodeFetch extends Endpoint {
  schema = {
    request: {
      params: z.object({
        code: z.string().length(6, 'Invalid code'),
      }),
    },
    responses: {
      '200': {
        description: 'Returns a single file if found',
        content: {
          'application/json': {
            schema: fileSelectSchema,
          },
        },
      },
      '404': {
        description: 'File not found',
        content: {
          'application/json': {
            schema: z.object({
              message: z.string(),
            }),
          },
        },
      },
    },
  }

  async handle(c: Context) {
    const data = await this.getValidatedData<typeof this.schema>()
    const code = data.params.code.toUpperCase()

    const db = this.getDB(c)

    const file = await getFile(db, code)

    if (!file) {
      return this.error('INVALID_CODE')
    }

    const day = dayjs(file.due_date)
    if (day.isBefore(dayjs())) {
      return this.error('SHARE_EXPIRED')
    }

    const { objectId, ...rest } = file

    // 閱後即焚
    if (rest.is_ephemeral) {
      await db
        .update(files)
        .set({
          due_date: new Date(0),
        })
        .where(eq(files.id, rest.id))
    }

    const token = createId()
    const kv = this.getKV(c)
    await kv.put(token, token, {
      expirationTtl: 60 * 5,
    })

    return this.success({
      ...rest,
      token,
      due_date: day.isSame(MAX_DURATION) ? null : file.due_date,
    })
  }
}
