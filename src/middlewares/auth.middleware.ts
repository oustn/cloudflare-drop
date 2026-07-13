import { createMiddleware } from 'hono/factory'
import { bearerAuth } from 'hono/bearer-auth'
import { HTTPException } from 'hono/http-exception'
import { Context } from 'hono'

export const adminMiddleware = createMiddleware<{
  Variables: {
    db?: D1Database
  }
}>(async (c: Context, next) => {
  if (!c.env.ADMIN_TOKEN) {
    throw new HTTPException(401, { message: 'ADMIN_DISABLED' })
  }
  const bearer = bearerAuth({ token: c.env.ADMIN_TOKEN })
  return bearer(c, next)
})
