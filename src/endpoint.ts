import { OpenAPIRoute } from 'chanfana'
import { Context } from 'hono'
import { DrizzleD1Database } from 'drizzle-orm/d1'
import { HTTPException } from 'hono/http-exception'

export class Endpoint extends OpenAPIRoute {
  getDB(c: Context): DrizzleD1Database {
    const db = c.get('db')
    return db
  }

  getKV(c: Context): KVNamespace {
    if (!c.env.file_drops) {
      throw new HTTPException(400, {
        message: 'KV namespace binding not found',
      })
    }
    return c.env.file_drops
  }

  error(message: string, text?: boolean, code?: number) {
    if (text) {
      return new Response(message, {
        status: code ?? 400,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }
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
