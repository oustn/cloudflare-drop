import { Endpoint } from '../endpoint'
import { Context } from 'hono'
import { z } from 'zod'
import { files, fileSelectSchema } from '../../data/schemas'
import { eq } from 'drizzle-orm'
import dayjs from 'dayjs'

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
    const [file] = await db
      .select({
        code: files.code,
        filename: files.filename,
        hash: files.hash,
        objectId: files.objectId,
        due_date: files.due_date,
        type: files.type,
      })
      .from(files)
      .where(eq(files.code, code))
    if (!file) {
      return this.error('分享码无效')
    }

    const day = dayjs(file.due_date)
    if (day.isBefore(dayjs())) {
      return this.error('分享已过期')
    }

    return this.success(file)
  }
}
