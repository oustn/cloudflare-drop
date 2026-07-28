import { readFile } from 'node:fs/promises'
import { expect, test } from 'vitest'

test('route pages are lazy loaded from the web entry point', async () => {
  const source = await readFile(
    new URL('../web/main.tsx', import.meta.url),
    'utf8',
  )

  expect(source).toContain("import('./views/Home')")
  expect(source).toContain("import('./views/Admin')")
  expect(source).not.toContain("import { Home, Admin } from './views'")
})

test('route lazy loading uses the preact-iso boundary implementation', async () => {
  const source = await readFile(
    new URL('../web/main.tsx', import.meta.url),
    'utf8',
  )

  expect(source).toMatch(
    /import \{[^}]*\blazy\b[^}]*\bErrorBoundary\b[^}]*\} from 'preact-iso'/,
  )
  expect(source).not.toContain("from 'preact/compat'")
})
