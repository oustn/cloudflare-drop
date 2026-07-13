import { Context } from 'hono'
import { z } from 'zod'

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
      throw new Error('CHUNK_UPLOAD_FAILED')
    }

    const kv = this.getKV(c)
    const key = `${uuid}_${sha}.${chunkId}`

    await kv.put(key, await (chunk as File).arrayBuffer(), {
      expirationTtl: 5 * 60, // 5 分鐘後過期
    })

    return new Response(null, {
      status: 201,
    })
  }
}
