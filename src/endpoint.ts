import { OpenAPIRoute } from 'chanfana'
import { Context } from 'hono'
import { DrizzleD1Database } from 'drizzle-orm/d1'

export class Endpoint extends OpenAPIRoute {
  getDB(c: Context): DrizzleD1Database {
    const db = c.get('db')
    return db
  }

  getKV(c: Context): KVNamespace {
    return c.env.file_drops
  }

  error(payload: unknown, code = 400) {
    return new Response(JSON.stringify(payload), {
      status: code,
      headers: {
        'Content-Type': 'application/json; utf-8',
      },
    })
  }
}
