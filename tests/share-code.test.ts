import { expect, test } from 'vitest'

import { createNumericShareCode } from '../src/shareCode'

test('share codes are always six ASCII digits', () => {
  for (let index = 0; index < 100; index += 1) {
    expect(createNumericShareCode()).toMatch(/^\d{6}$/)
  }
})
