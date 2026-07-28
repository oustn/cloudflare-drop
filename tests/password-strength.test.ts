import { expect, test } from 'vitest'

import { passwordStrength } from '../web/helpers/password'

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
