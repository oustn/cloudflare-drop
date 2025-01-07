import {createMiddleware} from 'hono/factory'
import {HTTPException} from 'hono/http-exception'
import {Context} from 'hono'

import { DbService } from '../../data/services'

export const dbMiddleware = createMiddleware<{
  Variables: {
    db?: DbService
  },
}>(async (c: Context, next) => {
  if (!c.env.DB) {
    throw new HTTPException(400, {message: "D1 database binding not found"})
  }
  const db = new DbService(c.env.DB);
  c.set('db', db)
  await next()
});
