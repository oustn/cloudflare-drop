import { z } from 'zod'
import { Context } from 'hono'
import { eq } from 'drizzle-orm'

import { Endpoint } from '../endpoint'
import { files, fileSelectSchema } from '../../data/schemas'

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
    const tokenValue = await kv.get(token, 'text')
    if (!tokenValue || tokenValue !== token) {
      return this.error('INVALID_TOKEN', true)
    }
    await kv.delete(token)
    const db = this.getDB(c)
    const [record] = await db.select().from(files).where(eq(files.id, id))
    if (!record) {
      return this.error('INVALID_OBJECT_ID', true)
    }
    const objectId = record.objectId

    const {
      value: file,
      metadata,
    }: {
      value: null | ArrayBuffer
      metadata: null | Array<{
        objectId: string
        chunkId: number
      }>
    } = await kv.getWithMetadata(objectId, 'arrayBuffer')

    if (!file && !metadata) {
      return this.error('Not found', true, 404)
    }

    if (metadata) {
      // 大於 25 MB 時不考慮檔案類型
      const { readable, writable } = new TransformStream()
      const writer = writable.getWriter()
      ;(async () => {
        for (let i = 0; i < metadata.length; i++) {
          const chunk = await kv.get(metadata[i].objectId, 'arrayBuffer')
          if (!chunk) {
            await writer.close()
            throw new Error('CHUNK_INCOMPLETE')
          }
          await writer.write(new Uint8Array(chunk))
        }
        await writer.close()
      })().then()

      return new Response(readable, {
        status: 200,
        headers: {
          'Content-Type': record.type ?? 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${record.filename}"`,
        },
      })
    }

    const isText = record.type === 'plain/string'

    return new Response(file, {
      status: 200,
      headers: new Headers({
        'Content-Type': isText
          ? 'plain/text'
          : (record.type ?? 'application/octet-stream'),
        'Content-Disposition':
          isText || record.is_encrypted
            ? 'inline'
            : `attachment; filename="${record.filename}"`,
      }),
    })
  }
}
