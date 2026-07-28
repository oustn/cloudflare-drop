import { expect, test } from 'vitest'

import { contentDisposition, responseContentType } from '../src/http'

test('attachment headers include UTF-8 and ASCII fallback filenames', () => {
  expect(contentDisposition('报告 2026.txt')).toBe(
    `attachment; filename=" 2026.txt"; filename*=UTF-8''${encodeURIComponent('报告 2026.txt')}`,
  )
})

test('plain shared text declares UTF-8 explicitly', () => {
  expect(responseContentType('plain/string')).toBe('text/plain; charset=utf-8')
  expect(responseContentType('text/csv')).toBe('text/csv; charset=utf-8')
})
