import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { Context } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import {
  consumeDownloadGrant,
  lookupShare,
  resolveDownloadGrant,
  ShareError,
} from '../shares'
import { storageForProvider } from '../storage'
import { contentDisposition, responseContentType, textResponse } from '../http'

export const terminalMiddleware = createMiddleware<{
  Variables: {
    db?: D1Database
  }
}>(async (c: Context, next) => {
  const ua = (c.req.header('User-Agent') ?? '').toLowerCase()
  const code = c.req.query('code')
  if (!code) return next()
  if (!ua?.includes('wget') && !ua?.includes('curl')) return next()

  if (!c.env.DB) {
    throw new HTTPException(400, { message: 'D1 database binding not found' })
  }
  if (!c.env.file_drops) {
    throw new HTTPException(400, {
      message: 'KV namespace binding not found',
    })
  }
  const kv: KVNamespace = c.env.file_drops
  try {
    const db = drizzle(c.env.DB)
    const { file, token } = await lookupShare(db, kv, code)
    const record = await resolveDownloadGrant(db, kv, token, file.id)
    const object = await storageForProvider(c.env, record.storage_provider).get(
      record.objectId,
    )
    if (!object) return textResponse('Not found', 404)
    await consumeDownloadGrant(kv, token)

    const isText = record.type === 'plain/string'
    return new Response(object.body, {
      status: 200,
      headers: new Headers({
        'Content-Type': responseContentType(record.type),
        'Content-Disposition': contentDisposition(
          record.filename ?? 'download',
          isText,
        ),
      }),
    })
  } catch (error) {
    const message = error instanceof ShareError ? error.message : '文件读取失败'
    return textResponse(message, 404)
  }
})
