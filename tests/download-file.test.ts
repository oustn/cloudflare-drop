import { afterEach, expect, test, vi } from 'vitest'

import { fetchFile } from '../web/api'
import { Encryptor } from '../web/helpers'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('encrypted file download clicks do not bubble into the SPA router', async () => {
  const routeBlobUrl = vi.fn(() => {
    throw new DOMException('blocked blob route', 'SecurityError')
  })
  const clickListeners: Array<(event: { stopPropagation(): void }) => void> = []
  const anchor = {
    href: '',
    download: '',
    addEventListener: (
      event: string,
      listener: (event: { stopPropagation(): void }) => void,
    ) => {
      if (event === 'click') clickListeners.push(listener)
    },
    click: vi.fn(() => {
      let stopped = false
      for (const listener of clickListeners) {
        listener({
          stopPropagation: () => {
            stopped = true
          },
        })
      }
      if (!stopped) routeBlobUrl()
    }),
  }

  vi.stubGlobal('document', {
    createElement: vi.fn((tag: string) => {
      expect(tag).toBe('a')
      return anchor
    }),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    },
  })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:/download')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  vi.spyOn(Encryptor, 'decryptWithMetadata').mockResolvedValue({
    blob: new Blob(['decrypted'], { type: 'text/plain' }),
    metadata: { filename: '报告.txt', type: 'text/plain' },
  })

  const [_file, error] = await fetchFile(
    new Blob(['encrypted']),
    'file-id',
    'secret',
    'fallback.txt',
    'token',
  )

  expect(error).toBeNull()
  expect(routeBlobUrl).not.toHaveBeenCalled()
  expect(anchor.download).toBe('报告.txt')
})
