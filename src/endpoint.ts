import { OpenAPIRoute } from 'chanfana'
import { Context } from 'hono'
import { DrizzleD1Database } from 'drizzle-orm/d1'

export class Endpoint extends OpenAPIRoute {
  getDB(c: Context): DrizzleD1Database {
    const db = c.get('db')
    return db
  }
}
