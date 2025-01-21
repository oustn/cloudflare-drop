import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { Context } from 'hono'
import { drizzle } from 'drizzle-orm/d1'

export const dbMiddleware = createMiddleware<{
  Variables: {
    db?: D1Database
  }
}>(async (c: Context, next) => {
  if (!c.env.DB) {
    throw new HTTPException(400, { message: 'D1 database binding not found' })
  }
  c.set('db', drizzle(c.env.DB))
  await next()
})
