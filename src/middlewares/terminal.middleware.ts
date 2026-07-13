import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { Context } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { getFile } from '../files'
import dayjs from 'dayjs'

export const terminalMiddleware = createMiddleware<{
  Variables: {
    db?: D1Database
  }
}>(async (c: Context, next) => {
  const ua = (c.req.header('User-Agent') ?? '').toLowerCase()
  const code = c.req.query('code')
  if (!code) return next()
  if (!ua?.includes('wget') && !ua?.includes('curl')) return next()

  const db = drizzle(c.env.DB)
  if (!c.env.DB) {
    throw new HTTPException(400, { message: 'D1 database binding not found' })
  }
  const file = await getFile(db, code)
  if (!file) {
    return c.text('分享碼無效 / Invalid share code', {
      status: 404,
    })
  }
  const day = dayjs(file.due_date)
  if (day.isBefore(dayjs())) {
    return c.text('分享已過期 / Share has expired', {
      status: 410,
    })
  }
  if (!c.env.file_drops) {
    throw new HTTPException(400, {
      message: 'KV namespace binding not found',
    })
  }
  const kv: KVNamespace = c.env.file_drops
  const object = await kv.get(file.objectId)
  if (!object) {
    return c.text('Not found', {
      status: 404,
    })
  }
  const isText = file.type === 'plain/string'

  return new Response(object, {
    status: 200,
    headers: new Headers({
      'Content-Type': isText
        ? 'plain/text'
        : (file.type ?? 'application/octet-stream'),
      'Content-Disposition': isText
        ? 'inline'
        : `attachment; filename="${file.filename}"`,
    }),
  })
})
