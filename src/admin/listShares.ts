import { Context } from 'hono'
import { asc, desc } from 'drizzle-orm'
import z from 'zod'

import { Endpoint } from '../endpoint'
import { files } from '../../data/schemas'
import { MAX_DURATION } from '../common'
import dayjs from 'dayjs'

export class ListShares extends Endpoint {
  schema = {
    request: {
      query: z.object({
        size: z.number().optional(),
        page: z.number().optional(),
        orderBy: z.enum(['size', 'due_date', 'created_at']).optional(),
        order: z.enum(['asc', 'desc']).optional(),
      }),
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
    const { query } = await this.getValidatedData<typeof this.schema>()
    const {
      size: requestedSize = 10,
      page: requestedPage = 0,
      order,
      orderBy,
    } = query
    const pageSize = Math.min(Math.max(requestedSize, 1), 100)
    const page = Math.max(requestedPage, 0)
    const db = this.getDB(c)

    const recordQuery = db.select().from(files)

    if (order && orderBy) {
      const orderFn = order === 'asc' ? asc : desc
      recordQuery.orderBy(orderFn(files[orderBy]))
    }

    const records = await recordQuery.limit(pageSize).offset(page * pageSize)

    const total = await db.$count(files)

    return {
      data: {
        items: records.map((r) => ({
          ...r,
          due_date: dayjs(r.due_date).isSame(MAX_DURATION) ? null : r.due_date,
          created_at: !r.created_at?.getTime() ? null : r.created_at,
        })),
        total,
        page,
        size: pageSize,
      },
      result: true,
      message: null,
    }
  }
}
