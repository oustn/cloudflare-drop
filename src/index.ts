import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import {
  dbMiddleware,
  limitMiddleware,
  terminalMiddleware,
  adminMiddleware,
} from './middlewares'
import {
  FileChunkCreate,
  FileCreate,
  FileFetch,
  FileShareCodeFetch,
  GetFileChunkInfo,
  MergeFileChunk,
} from './files'
import {
  DeleteShare,
  GetInfo,
  ListShares,
  AdminDownloadFile,
  UpdateFile,
} from './admin'

import { scheduled } from './scheduled'

// Start a Hono app
const app = new Hono<{
  Bindings: Env
}>()

// DB service
app.use('/api/*', dbMiddleware)
app.use('/files/*', dbMiddleware)
app.use('/files', limitMiddleware)
app.use('/api/admin/*', adminMiddleware)
app.use('/', terminalMiddleware)

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/doc',
})

openapi.put('/files', FileCreate)
openapi.post('/files/chunks', GetFileChunkInfo)
openapi.put('/files/chunks', FileChunkCreate)
openapi.post('/files/chunks/merged', MergeFileChunk)
openapi.get('/files/:id', FileFetch)
openapi.get('/files/share/:code', FileShareCodeFetch)

openapi.get('/api/admin/info', GetInfo)
openapi.get('/api/admin/shares', ListShares)
openapi.delete('/api/admin/shares', DeleteShare)
openapi.get('/api/admin/files/:id', AdminDownloadFile)
openapi.put('/api/admin/files/:id', UpdateFile)

app.all(
  '/api/*',
  async () =>
    new Response('Method Not Allowed', {
      status: 405,
    }),
)

app.all(
  '/files/*',
  async () =>
    new Response('Method Not Allowed', {
      status: 405,
    }),
)

// Web
app.get('/*', async (c) => {
  if (c.env.ENVIRONMENT === 'dev') {
    const url = new URL(c.req.raw.url)
    url.port = c.env.SHARE_PORT
    return fetch(new Request(url, c.req.raw))
  }
  return c.env.ASSETS.fetch(c.req.raw)
})

// Export the Hono app
export default {
  fetch: app.fetch,
  scheduled,
}
