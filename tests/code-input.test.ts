import { expect, test } from 'vitest'

import {
  applyDigits,
  digitsOnly,
  extractShareCodeDigits,
} from '../web/views/Home/components/codeInput'

test('code input accepts only ASCII digits', () => {
  expect(digitsOnly('A1 2-3x')).toBe('123')
  expect(digitsOnly('１２３')).toBe('')
  expect(digitsOnly(undefined)).toBe('')
})

test('share code extraction supports pure codes and URL code params', () => {
  expect(extractShareCodeDigits('687607')).toBe('687607')
  expect(extractShareCodeDigits('http://localhost:3333?code=687607')).toBe(
    '687607',
  )
  expect(extractShareCodeDigits('http://localhost:3333/?code=687607')).toBe(
    '687607',
  )
  expect(
    extractShareCodeDigits('https://airdrop.wanq.uk/?code=687607&foo=1'),
  ).toBe('687607')
  expect(extractShareCodeDigits('http://localhost:3333')).toBe('')
})

test('pasted digits fill remaining inputs and return the final focus index', () => {
  expect(applyDigits(['', '', '', '', '', ''], 1, '提取码: 123456')).toEqual({
    values: ['', '1', '2', '3', '4', '5'],
    focusIndex: 5,
  })
})

test('pasted share URLs fill from the code query instead of the port', () => {
  expect(
    applyDigits(
      ['', '', '', '', '', ''],
      0,
      'http://localhost:3333?code=687607',
    ),
  ).toEqual({
    values: ['6', '8', '7', '6', '0', '7'],
    focusIndex: 5,
  })
})
