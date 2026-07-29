import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'

import { passwordStrength } from '../web/helpers/password'

const passwordSwitchSource = readFileSync(
  new URL('../web/views/Home/components/PasswordSwitch.tsx', import.meta.url),
  'utf8',
)

test('rates short, simple passwords as weak', () => {
  expect(passwordStrength('abc')).toMatchObject({ label: '弱', value: 33 })
})

test('rates mixed passwords as medium', () => {
  expect(passwordStrength('abc12345')).toMatchObject({ label: '中', value: 66 })
})

test('rates long, varied passwords as strong', () => {
  expect(passwordStrength('Abc12345!long')).toMatchObject({
    label: '强',
    value: 100,
  })
})

test('password dialog keeps the strength meter visible for empty passwords', () => {
  expect(passwordSwitchSource).toContain(
    'const strength = showStrength ? passwordStrength(result) : null',
  )
  expect(passwordSwitchSource).not.toContain(
    'showStrength && result ? passwordStrength(result) : null',
  )
})

test('password dialog tells browsers and password managers not to remember sharing passwords', () => {
  expect(passwordSwitchSource).toContain('autoComplete="new-password"')
  expect(passwordSwitchSource).toContain("autoComplete: 'new-password'")
  expect(passwordSwitchSource).toContain("name: 'share-password'")
  expect(passwordSwitchSource).toContain("'data-bwignore': true")
  expect(passwordSwitchSource).toContain("'data-lpignore': true")
  expect(passwordSwitchSource).toContain("'data-1p-ignore': true")
  expect(passwordSwitchSource).toContain("'data-op-ignore': true")
})

test('password input reserves room so the outline is not clipped by the dialog content', () => {
  expect(passwordSwitchSource).toContain('<div className="px-0.5 pt-1.5">')
})
