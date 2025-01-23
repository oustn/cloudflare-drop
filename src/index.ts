import { fromHono } from 'chanfana'
import { Hono } from 'hono'
import { dbMiddleware } from './middlewares'
import { TaskCreate } from './endpoints/taskCreate'
import { TaskDelete } from './endpoints/taskDelete'
import { TaskFetch } from './endpoints/taskFetch'
import { TaskList } from './endpoints/taskList'
import { FileCreate, FileFetch, FileShareCodeFetch } from './files'

import { scheduled } from './scheduled'

// Start a Hono app
const app = new Hono<{
  Bindings: Env
}>()

// DB service
app.use('/api/*', dbMiddleware)
app.use('/files/*', dbMiddleware)

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/doc',
})

// Register OpenAPI endpoints
openapi.get('/api/tasks', TaskList)
openapi.post('/api/tasks', TaskCreate)
openapi.get('/api/tasks/:taskSlug', TaskFetch)
openapi.delete('/api/tasks/:taskSlug', TaskDelete)

openapi.put('/files', FileCreate)
openapi.get('/files/:objectId', FileFetch)
openapi.get('/files/share/:code', FileShareCodeFetch)

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
