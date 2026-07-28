import { expect, test, vi } from 'vitest'

import { FileChunkCreate } from '../src/files/fileChunkCreate'

test('chunk uploads persist metadata needed for direct streaming finalization', async () => {
  const formData = new FormData()
  formData.append('uuid', 'user')
  formData.append('sha', 'file-sha')
  formData.append('chunkId', '0')
  formData.append('chunk', new File(['abc'], 'chunk.bin'))

  const put = vi.fn()
  const kv = {
    get: vi.fn(async (key: string, type: string) => {
      if (key === 'user_file-sha' && type === 'json') {
        return {
          sha: 'file-sha',
          uuid: 'user',
          size: 3,
          chunks: [{ chunkId: 0, size: 3 }],
        }
      }
      return null
    }),
    put,
  }

  const response = await new FileChunkCreate().handle({
    env: { file_drops: kv },
    req: { formData: async () => formData },
  } as never)

  expect(response.status).toBe(201)
  expect(put).toHaveBeenCalledWith(
    'user_file-sha.0',
    expect.any(ArrayBuffer),
    expect.objectContaining({
      expirationTtl: 5 * 60,
      metadata: { size: 3, hash: 'file-sha' },
    }),
  )
})
