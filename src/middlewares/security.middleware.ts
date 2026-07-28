import { createMiddleware } from 'hono/factory'

function isSensitiveRequest(path: string, hasShareCode: boolean) {
  return (
    hasShareCode ||
    path.startsWith('/files/share/') ||
    /^\/files\/[^/]+$/.test(path) ||
    path.startsWith('/api/admin/')
  )
}

export const securityMiddleware = createMiddleware(async (c, next) => {
  await next()

  // Responses returned by downstream handlers can expose immutable headers.
  const headers = new Headers(c.res.headers)
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  if (isSensitiveRequest(c.req.path, Boolean(c.req.query('code')))) {
    headers.set('Cache-Control', 'no-store, max-age=0')
    headers.set('Pragma', 'no-cache')
  }

  if (c.env.ENVIRONMENT !== 'dev') {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    )
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )
  }

  c.res = new Response(c.res.body, {
    status: c.res.status,
    statusText: c.res.statusText,
    headers,
  })
})
