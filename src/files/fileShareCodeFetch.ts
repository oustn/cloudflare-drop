import { Endpoint } from '../endpoint'
import { Context } from 'hono'
import { z } from 'zod'
import { DrizzleD1Database } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import dayjs from 'dayjs'
import { files, fileSelectSchema } from '../../data/schemas'
import { MAX_DURATION } from '../common'
import { lookupShare, ShareError } from '../shares'

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
      storage_provider: files.storage_provider,
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

    try {
      const { file, token } = await lookupShare(
        this.getDB(c),
        this.getKV(c),
        code,
      )
      const day = dayjs(file.due_date)
      const { objectId, ...rest } = file

      return this.success({
        ...rest,
        token,
        due_date: day.isSame(MAX_DURATION) ? null : file.due_date,
      })
    } catch (error) {
      return this.error(
        error instanceof ShareError ? error.message : '分享读取失败',
      )
    }
  }
}
