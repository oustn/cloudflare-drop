import { Context } from 'hono'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'

import { Endpoint } from '../endpoint'

export class FileChunkCreate extends Endpoint {
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
    const formData = await c.req.formData()
    const uuid = formData.get('uuid')
    const sha = formData.get('sha')
    const chunk = formData.get('chunk')
    const chunkId = Number.parseInt(
      (formData.get('chunkId') as string) ?? '-1',
      10,
    )

    if (!uuid || !sha || !chunk || chunkId < 0) {
      throw new Error('文件 Chunk 上传错误')
    }

    const kv = this.getKV(c)
    const manifestKey = `${uuid}_${sha}`
    const manifest: ChunkInfo | null = await kv.get(manifestKey, 'json')
    const expected = manifest?.chunks.find((item) => item.chunkId === chunkId)
    const file = chunk as File
    if (!expected || file.size !== expected.size) {
      throw new HTTPException(400, { message: '文件 Chunk 大小错误' })
    }
    const key = `${uuid}_${sha}.${chunkId}`
    if (await kv.get(key, 'stream')) {
      throw new HTTPException(409, { message: '文件 Chunk 已上传' })
    }

    await kv.put(key, await file.arrayBuffer(), {
      expirationTtl: 5 * 60, // 5 分钟过期
      metadata: { size: file.size, hash: sha },
    })

    return new Response(null, {
      status: 201,
    })
  }
}
