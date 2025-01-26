import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { Context } from 'hono'

export const limitMiddleware = createMiddleware(async (c: Context, next) => {
  if (!c.env.UPLOAD_LIMIT || c.env.ENVIRONMENT === 'dev') {
    return next()
  }

  const ipAddress = c.req.header('cf-connecting-ip') || ''

  if (!ipAddress) {
    throw new HTTPException(429, {
      message: '429 Failure – rate limit exceeded for empty IP address',
    })
  }

  const { success } = await c.env.UPLOAD_LIMIT.limit({ key: ipAddress })

  if (!success) {
    throw new HTTPException(429, {
      message: `429 Failure – rate limit exceeded for IP address ${ipAddress}`,
    })
  }
  await next()
})
