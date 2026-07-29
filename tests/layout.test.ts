import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const layoutSource = readFileSync(
  new URL('../web/components/Layout.tsx', import.meta.url),
  'utf8',
)

test('header aligns logo, language switch, and GitHub button on the same vertical center line', () => {
  expect(layoutSource).toContain(
    'className="flex flex-row items-center gap-2 no-underline"',
  )
  expect(layoutSource).toContain('className="flex items-center gap-2"')
  expect(layoutSource).toContain("height: '80px'")
  expect(layoutSource).toContain("width: 'auto'")
  expect(layoutSource).not.toContain('height="80"')
  expect(layoutSource).toContain("position: 'relative'")
  expect(layoutSource).toContain("top: '10px'")
  expect(layoutSource).not.toContain('translateY')
  expect(layoutSource).not.toContain('style="top: 14px"')
  expect(layoutSource).not.toContain('top: -10')
})
