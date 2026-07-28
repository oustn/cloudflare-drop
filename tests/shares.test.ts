import { expect, test } from 'vitest'

import { isDownloadGrant } from '../src/shares'

test('a download grant is valid only for its bound file', () => {
  expect(isDownloadGrant({ fileId: 'file-a' }, 'file-a')).toBe(true)
  expect(isDownloadGrant({ fileId: 'file-a' }, 'file-b')).toBe(false)
  expect(isDownloadGrant('token', 'file-a')).toBe(false)
})
