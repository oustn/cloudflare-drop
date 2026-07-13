import { contentJson } from 'chanfana'
import { z } from 'zod'
import { Context } from 'hono'
import { createId } from '@paralleldrive/cuid2'

import { Endpoint } from '../endpoint'

export class MergeFileChunk extends Endpoint {
  schema = {
    request: {
      body: contentJson(
        z.object({
          sha: z.string(),
          uuid: z.string(),
        }),
      ),
    },
    responses: {
      '200': {
        description: 'Returns a single file if found',
        content: {
          'application/json': {
            schema: {},
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
    const payload = data.body
    const kv = this.getKV(c)
    const key = `${payload.uuid}_${payload.sha}`
    const record: ChunkInfo | null = await kv.get(key, 'json')
    if (!record) {
      throw new Error('CHUNK_NOT_FOUND')
    }

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    ;(async () => {
      for (let i = 0; i < record.chunks.length; i++) {
        const chunk = await kv.get(`${key}.${i}`, 'arrayBuffer')
        if (!chunk) {
          await writer.close()
          throw new Error('CHUNK_INCOMPLETE')
        }
        await writer.write(new Uint8Array(chunk))
      }
      await writer.close()
    })().then()

    const id = createId()
    await kv.put(id, readable)

    return c.json({
      data: id,
      result: true,
      message: 'ok',
    })
  }
}
