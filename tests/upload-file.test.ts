import { afterEach, expect, test, vi } from 'vitest'
import axios from 'axios'

import { uploadFile } from '../web/api'
import { Uploader } from '../web/api/uploader'
import { Encryptor } from '../web/helpers'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
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

test('finalizes unencrypted chunk uploads with chunk ids instead of merging chunks', async () => {
  const originalChunkSize = Uploader.CHUNK_SIZE
  const originalKvChunkSize = Uploader.KV_CHUNK_SIZE
  const originalMaxKvChunkSize = Uploader.MAX_KV_CHUNK_SIZE
  Uploader.CHUNK_SIZE = 2
  Uploader.KV_CHUNK_SIZE = 10
  Uploader.MAX_KV_CHUNK_SIZE = 20

  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(
    'test-user' as `${string}-${string}-${string}-${string}-${string}`,
  )

  let finalFormData: FormData | null = null
  vi.spyOn(axios, 'put').mockImplementation(async (url, body) => {
    if (url === '/files/chunks') {
      return { data: null }
    }
    if (url === '/files') {
      finalFormData = body as FormData
      return {
        data: {
          result: true,
          data: { id: 'file-id', code: '123456' },
          message: 'ok',
        },
      }
    }
    throw new Error(`unexpected axios put ${url}`)
  })

  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input) => {
      if (input === '/files/chunks') {
        return new Response(
          JSON.stringify({
            result: true,
            data: {
              sha: 'unused',
              uuid: 'test-user',
              size: 6,
              chunks: [
                { chunkId: 0, size: 2 },
                { chunkId: 1, size: 2 },
                { chunkId: 2, size: 2 },
              ],
              finished: [],
            },
            message: 'ok',
          }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (input === '/files/chunks/merged') {
        throw new Error('chunk merge endpoint should not be called')
      }
      throw new Error(`unexpected fetch ${input}`)
    })

  try {
    await expect(
      uploadFile({
        data: new File(['abcdef'], 'hello.txt', { type: 'text/plain' }),
      }),
    ).resolves.toMatchObject({ result: true })

    expect(fetchMock).not.toHaveBeenCalledWith(
      '/files/chunks/merged',
      expect.anything(),
    )
    expect(finalFormData?.get('file')).toBeNull()
    const fileInfo = JSON.parse(finalFormData?.get('fileInfo') as string)
    expect(fileInfo.objectId).toEqual([
      { objectId: `test-user_${fileInfo.sha}.0` },
      { objectId: `test-user_${fileInfo.sha}.1` },
      { objectId: `test-user_${fileInfo.sha}.2` },
    ])
  } finally {
    Uploader.CHUNK_SIZE = originalChunkSize
    Uploader.KV_CHUNK_SIZE = originalKvChunkSize
    Uploader.MAX_KV_CHUNK_SIZE = originalMaxKvChunkSize
  }
})
