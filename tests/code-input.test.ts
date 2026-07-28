import { expect, test } from 'vitest'

import { applyDigits, digitsOnly } from '../web/views/Home/components/codeInput'

test('code input accepts only ASCII digits', () => {
  expect(digitsOnly('A1 2-3x')).toBe('123')
  expect(digitsOnly('１２３')).toBe('')
  expect(digitsOnly(undefined)).toBe('')
})

test('pasted digits fill remaining inputs and return the final focus index', () => {
  expect(applyDigits(['', '', '', '', '', ''], 1, '提取码: 123456')).toEqual({
    values: ['', '1', '2', '3', '4', '5'],
    focusIndex: 5,
  })
})
