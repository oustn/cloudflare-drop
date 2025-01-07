import {fromHono} from "chanfana";
import {Hono} from "hono";
import { dbMiddleware } from "./middlewares";
import {TaskCreate} from "./endpoints/taskCreate";
import {TaskDelete} from "./endpoints/taskDelete";
import {TaskFetch} from "./endpoints/taskFetch";
import {TaskList} from "./endpoints/taskList";

// Start a Hono app
const app = new Hono<{
  Bindings: Env
}>();

// DB service
app.use("/api/*", dbMiddleware)

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: '/doc',
});

// Register OpenAPI endpoints
openapi.get("/api/tasks", TaskList);
openapi.post("/api/tasks", TaskCreate);
openapi.get("/api/tasks/:taskSlug", TaskFetch);
openapi.delete("/api/tasks/:taskSlug", TaskDelete);

// Web
app.get("/*", async (c) => {
  if (c.env.ENVIRONMENT === 'dev') {
    const url = new URL(c.req.raw.url)
    url.port = c.env.VITE_PORT
    return fetch(new Request(url, c.req.raw))
  }
  return c.env.ASSETS.fetch(c.req.raw)
})

// Export the Hono app
export default app;
