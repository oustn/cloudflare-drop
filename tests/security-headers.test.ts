import { expect, test } from 'vitest'
import { Hono } from 'hono'

import { securityMiddleware } from '../src/middlewares/security.middleware'

test('adds browser security headers and prevents caching a share lookup', async () => {
  const app = new Hono<{ Bindings: Env }>()
  app.use('*', securityMiddleware)
  app.get('/files/share/:code', (c) => c.text('ok'))

  const response = await app.request(
    'https://drop.example/files/share/123456',
    {
      headers: { 'cf-connecting-ip': '127.0.0.1' },
    },
    { ENVIRONMENT: 'production' } as Env,
  )

  expect(response.headers.get('cache-control')).toBe('no-store, max-age=0')
  expect(response.headers.get('referrer-policy')).toBe('no-referrer')
  expect(response.headers.get('content-security-policy')).toContain(
    "default-src 'self'",
  )
  expect(response.headers.get('content-security-policy')).toContain(
    "script-src 'self' 'wasm-unsafe-eval'",
  )
})
