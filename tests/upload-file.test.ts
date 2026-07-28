import { afterEach, expect, test, vi } from 'vitest'

import { uploadFile } from '../web/api'
import { Uploader } from '../web/api/uploader'
import { Encryptor } from '../web/helpers'

afterEach(() => {
  vi.restoreAllMocks()
})

function mockSuccessfulStreamUpload() {
  vi.spyOn(Encryptor, 'encryptStream').mockResolvedValueOnce({
    stream: new Blob(['encrypted']).stream(),
  })
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        result: true,
        data: { id: 'file-id', code: '123456' },
        message: '',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    ),
  )
}

test('returns an API error when an upload fails', async () => {
  vi.spyOn(Uploader, 'upload').mockRejectedValueOnce(new Error('upload failed'))

  await expect(uploadFile({ data: new Blob(['content']) })).resolves.toEqual({
    result: false,
    data: null,
    message: 'upload failed',
  })
})

test('does not reject encrypted files at the old in-memory encryption limit', async () => {
  const oversizedFile = { size: 25 * 1000 * 1000 + 1 } as Blob
  mockSuccessfulStreamUpload()

  await expect(
    uploadFile({ data: oversizedFile, password: 'long-enough-password' }),
  ).resolves.toMatchObject({ result: true })
})

test('allows short encryption passwords', async () => {
  const data = new Blob(['content'])
  mockSuccessfulStreamUpload()
  vi.spyOn(Uploader, 'upload').mockResolvedValueOnce({
    result: true,
    data: { id: 'file-id', code: '123456' },
    message: '',
  } as ApiResponseType<FileUploadedType>)

  await expect(uploadFile({ data, password: 'short' })).resolves.toMatchObject({
    result: true,
  })
  expect(Encryptor.encryptStream).toHaveBeenCalledWith(
    'short',
    data,
    expect.any(Function),
  )
  expect(Uploader.upload).not.toHaveBeenCalled()
  expect(fetch).toHaveBeenCalledWith(
    '/files/stream',
    expect.objectContaining({
      method: 'PUT',
      body: expect.any(ReadableStream),
    }),
  )
})
