import { Endpoint } from '../endpoint'
import { z } from 'zod'
import { fileSelectSchema } from '../../data/schemas'
import { Context } from 'hono'

export class FileFetch extends Endpoint {
  schema = {
    request: {
      params: z.object({
        objectId: z.string(),
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
    const objectId = data.params.objectId
    const kv = this.getKV(c)
    const file = await kv.get(objectId, 'arrayBuffer')
    if (!file) {
      return this.error(
        {
          message: 'Not found',
        },
        404,
      )
    }

    return new Response(file, {
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/octet-stream',
      }),
    })
  }
}
