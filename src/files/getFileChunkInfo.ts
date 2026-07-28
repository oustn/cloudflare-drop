import { contentJson } from 'chanfana'
import { z } from 'zod'
import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { Endpoint } from '../endpoint'

export class GetFileChunkInfo extends Endpoint {
  schema = {
    request: {
      body: contentJson(
        z.object({
          sha: z.string(),
          uuid: z.string(),
          size: z.number().gte(0),
          chunks: z.array(
            z.object({
              chunkId: z.number(),
              size: z.number(),
            }),
          ),
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
    const expectedSize = payload.chunks.reduce((total, chunk) => {
      if (
        !Number.isInteger(chunk.chunkId) ||
        chunk.chunkId < 0 ||
        chunk.size < 1
      ) {
        throw new HTTPException(400, { message: '文件 Chunk 信息错误' })
      }
      return total + chunk.size
    }, 0)
    if (expectedSize !== payload.size) {
      throw new HTTPException(400, { message: '文件 Chunk 大小错误' })
    }
    const kv = this.getKV(c)
    const key = `${payload.uuid}_${payload.sha}`
    const record: ChunkInfo | null = await kv.get(key, 'json')
    if (!record) {
      await kv.put(key, JSON.stringify(payload), {
        expirationTtl: 60 * 5,
      })

      return this.success({
        ...payload,
        finished: [],
      })
    }

    const list = (
      await kv.list({
        prefix: `${key}.`,
      })
    ).keys

    const finished = list.map((d) => ({
      chunkId: Number.parseInt(d.name.split('.')[1]),
      objectId: d.name,
    }))

    return c.json({
      data: {
        ...record,
        finished,
      },
      result: true,
      message: 'ok',
    })
  }
}
