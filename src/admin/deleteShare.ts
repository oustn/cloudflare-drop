import { Context } from 'hono'
import { inArray } from 'drizzle-orm'
import z from 'zod'

import { Endpoint } from '../endpoint'
import { files } from '../../data/schemas'
import { contentJson } from 'chanfana'
import { storageForProvider } from '../storage'

export class DeleteShare extends Endpoint {
  schema = {
    request: {
      body: contentJson(z.array(z.string())),
    },
    responses: {
      '200': {
        description: 'Returns basic info',
        content: {
          'application/json': {
            schema: {},
          },
        },
      },
    },
  }

  async handle(c: Context) {
    const { body: ids } = await this.getValidatedData<typeof this.schema>()
    const db = this.getDB(c)

    const records = await db
      .delete(files)
      .where(inArray(files.id, ids))
      .returning({
        objectId: files.objectId,
        storageProvider: files.storage_provider,
      })

    if (!records.length) {
      return {
        result: true,
        data: null,
        message: null,
      }
    }

    await Promise.all(
      records.map(async (d) => {
        await storageForProvider(c.env, d.storageProvider).delete(d.objectId)
      }),
    )

    return {
      data: null,
      result: true,
      message: null,
    }
  }
}
