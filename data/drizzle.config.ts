import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './data/schemas/*.schema.ts',
  out: './data/migrations',
  dialect: 'sqlite',
})
