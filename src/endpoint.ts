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

  error(message: string) {
    return {
      message,
      result: false,
      data: null,
    }
  }

  success(data: unknown) {
    return {
      message: 'ok',
      result: true,
      data,
    }
  }
}
