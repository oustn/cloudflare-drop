import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import {
  dbMiddleware,
  limitMiddleware,
  lookupLimitMiddleware,
  securityMiddleware,
  terminalMiddleware,
  adminMiddleware,
} from './middlewares'
import {
  FileCreate,
  FileFetch,
  FileShareCodeFetch,
  FileUploadSessionComplete,
  FileUploadSessionCreate,
  FileUploadSessionPartCreate,
} from './files'
import { DeleteShare, GetInfo, ListShares } from './admin'

import { scheduled } from './scheduled'
import { textResponse } from './http'

// Start a Hono app
const app = new Hono<{
  Bindings: Env
}>()

app.use('*', securityMiddleware)

// DB service
app.use('/api/*', dbMiddleware)
app.use('/files/*', dbMiddleware)
app.use('/files', limitMiddleware)
app.use('/api/admin/*', adminMiddleware)
app.use('/files/share/*', lookupLimitMiddleware)
app.use('/', terminalMiddleware)

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/doc',
})

openapi.put('/files', FileCreate)
openapi.post('/files/uploads', FileUploadSessionCreate)
openapi.put(
  '/files/uploads/:sessionId/parts/:partNumber',
  FileUploadSessionPartCreate,
)
openapi.post('/files/uploads/:sessionId/complete', FileUploadSessionComplete)
openapi.get('/files/:id', FileFetch)
openapi.get('/files/share/:code', FileShareCodeFetch)

openapi.get('/api/admin/info', GetInfo)
openapi.get('/api/admin/shares', ListShares)
openapi.delete('/api/admin/shares', DeleteShare)

app.all('/api/*', async () => textResponse('Method Not Allowed', 405))

app.all('/files/*', async () => textResponse('Method Not Allowed', 405))

// Web
app.get('/*', async (c) => {
  if (c.env.ENVIRONMENT === 'dev' || !c.env.ASSETS) {
    const url = new URL(c.req.raw.url)
    url.port = c.env.SHARE_PORT || '5173'
    return c.redirect(url.toString(), 302)
  }
  return c.env.ASSETS.fetch(c.req.raw)
})

// Export the Hono app
export default {
  fetch: app.fetch,
  scheduled,
}
