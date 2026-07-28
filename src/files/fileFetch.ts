import { z } from 'zod'
import { Context } from 'hono'
import { Endpoint } from '../endpoint'
import { fileSelectSchema } from '../../data/schemas'
import {
  consumeDownloadGrant,
  resolveDownloadGrant,
  ShareError,
} from '../shares'
import { storageForProvider } from '../storage'
import { contentDisposition, responseContentType } from '../http'

export class FileFetch extends Endpoint {
  schema = {
    request: {
      params: z.object({
        id: z.string(),
      }),
      query: z.object({
        token: z.string(),
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
    const id = data.params.id
    const token = data.query.token
    const kv = this.getKV(c)
    try {
      const record = await resolveDownloadGrant(this.getDB(c), kv, token, id)
      const storage = storageForProvider(c.env, record.storage_provider)
      const object = await storage.get(record.objectId)
      if (!object) return this.error('Not found', true, 404)
      await consumeDownloadGrant(kv, token)

      const isText = record.type === 'plain/string'
      return new Response(object.body, {
        status: 200,
        headers: new Headers({
          'Content-Type': responseContentType(record.type),
          'Content-Disposition': contentDisposition(
            record.filename ?? 'download',
            isText || Boolean(record.is_encrypted),
          ),
        }),
      })
    } catch (error) {
      return this.error(
        error instanceof ShareError ? error.message : '文件读取失败',
        true,
      )
    }
  }
}
