import { afterEach, expect, test, vi } from 'vitest'
import axios, { AxiosProgressEvent } from 'axios'

import { uploadFile } from '../web/api'
import { Uploader } from '../web/api/uploader'
import { Encryptor } from '../web/helpers'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function mockEncryptedSessionUpload() {
  vi.spyOn(Encryptor, 'encryptStream').mockResolvedValueOnce({
    stream: new Blob(['abcdef']).stream(),
    size: 6,
  })
  vi.spyOn(axios, 'put').mockImplementation(async (url, data, config) => {
    expect(url).toMatch(/^\/files\/uploads\/encrypted-session\/parts\/\d$/)
    expect(config?.headers).toMatchObject({
      'Content-Type': 'application/octet-stream',
    })
    const partNumber = Number(url.toString().split('/').at(-1))
    const expectedText = ['ab', 'cd', 'ef'][partNumber - 1]
    await expect(new Response(data as BodyInit).text()).resolves.toBe(
      expectedText,
    )
    return {
      data: { result: true, data: { partNumber }, message: 'ok' },
    }
  })
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = input.toString()
      if (url === '/files/uploads') {
        expect(init?.method).toBe('POST')
        const payload = JSON.parse(init?.body as string)
        expect(payload).toMatchObject({
          filename: 'encrypted-file',
          type: 'application/octet-stream',
          size: 6,
          hash: '',
          isEncrypted: true,
        })
        expect(payload.plaintextSize).toBeGreaterThan(0)
        return jsonResponse({
          result: true,
          data: {
            sessionId: 'encrypted-session',
            partSize: 2,
            uploadedParts: [],
          },
          message: 'ok',
        })
      }
      if (url === '/files/uploads/encrypted-session/complete') {
        expect(init?.method).toBe('POST')
        return jsonResponse({
          result: true,
          data: { id: 'file-id', code: '123456' },
          message: 'ok',
        })
      }
      throw new Error(`unexpected fetch ${url}`)
    })
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
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
  mockEncryptedSessionUpload()

  await expect(
    uploadFile({ data: oversizedFile, password: 'long-enough-password' }),
  ).resolves.toMatchObject({ result: true })
})

test('allows short encryption passwords for files', async () => {
  const data = new Blob(['content'], { type: 'application/octet-stream' })
  const fetchMock = mockEncryptedSessionUpload()
  vi.spyOn(Uploader, 'upload').mockResolvedValueOnce({
    result: true,
    data: { id: 'file-id', code: '123456' },
    message: '',
  } as ApiResponseType<FileUploadedType>)

  await expect(uploadFile({ data, password: 'short' })).resolves.toMatchObject({
    result: true,
  })
  expect(Encryptor.encryptStream).toHaveBeenCalledWith('short', data)
  expect(Uploader.upload).not.toHaveBeenCalled()
  expect(fetchMock).not.toHaveBeenCalledWith('/files/stream', expect.anything())
})

test('encrypted text uploads through the normal upload path so the server can keep it in KV', async () => {
  const data = new Blob(['secret text'], { type: 'plain/string' })
  const encrypted = new Blob(['encrypted text'], { type: 'plain/string' })
  vi.spyOn(Encryptor, 'encrypt').mockResolvedValueOnce(encrypted)
  const upload = vi.spyOn(Uploader, 'upload').mockResolvedValueOnce({
    result: true,
    data: { id: 'file-id', code: '123456' },
    message: 'ok',
  } as ApiResponseType<FileUploadedType>)
  const stream = vi.spyOn(Encryptor, 'encryptStream')

  await expect(uploadFile({ data, password: 'short' })).resolves.toMatchObject({
    result: true,
  })

  expect(Encryptor.encrypt).toHaveBeenCalledWith('short', data)
  expect(stream).not.toHaveBeenCalled()
  const formData = upload.mock.calls[0][0]
  const uploaded = formData.get('file') as File
  expect(uploaded.type).toBe('plain/string')
  await expect(uploaded.text()).resolves.toBe('encrypted text')
  expect(formData.get('isEncrypted')).toBe('true')
})

test('large unencrypted uploads use the generic upload session API', async () => {
  const originalChunkSize = Uploader.CHUNK_SIZE
  const originalMaxUploadSize = Uploader.MAX_UPLOAD_SIZE
  Uploader.CHUNK_SIZE = 2
  Uploader.MAX_UPLOAD_SIZE = 20
  const put = vi
    .spyOn(axios, 'put')
    .mockImplementation(async (url, data, config) => {
      expect(url).toMatch(/^\/files\/uploads\/session-1\/parts\/\d$/)
      expect(config?.headers).toMatchObject({
        'Content-Type': 'application/octet-stream',
      })
      const partNumber = Number(url.toString().split('/').at(-1))
      const expectedText = ['ab', 'cd', 'ef'][partNumber - 1]
      await expect(new Response(data as BodyInit).text()).resolves.toBe(
        expectedText,
      )
      return {
        data: { result: true, data: { partNumber }, message: 'ok' },
      }
    })
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = input.toString()
      if (url === '/files/uploads') {
        expect(init?.method).toBe('POST')
        return jsonResponse({
          result: true,
          data: {
            sessionId: 'session-1',
            partSize: 2,
            uploadedParts: [],
          },
          message: 'ok',
        })
      }
      if (url === '/files/uploads/session-1/complete') {
        expect(init?.method).toBe('POST')
        return jsonResponse({
          result: true,
          data: { id: 'file-id', code: '123456' },
          message: 'ok',
        })
      }
      throw new Error(`unexpected fetch ${url}`)
    })

  try {
    await expect(
      uploadFile({
        data: new File(['abcdef'], 'hello.txt', { type: 'text/plain' }),
      }),
    ).resolves.toMatchObject({ result: true })

    expect(fetchMock).not.toHaveBeenCalledWith(
      '/files/chunks',
      expect.anything(),
    )
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/files/chunks/merged',
      expect.anything(),
    )
    expect(put).not.toHaveBeenCalledWith('/files', expect.anything())
  } finally {
    Uploader.CHUNK_SIZE = originalChunkSize
    Uploader.MAX_UPLOAD_SIZE = originalMaxUploadSize
  }
})

test('large upload parts use axios upload progress without changing the session API', async () => {
  const originalChunkSize = Uploader.CHUNK_SIZE
  const originalMaxUploadSize = Uploader.MAX_UPLOAD_SIZE
  Uploader.CHUNK_SIZE = 2
  Uploader.MAX_UPLOAD_SIZE = 20
  const progress: number[] = []
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = input.toString()
      if (url === '/files/uploads') {
        expect(init?.method).toBe('POST')
        return jsonResponse({
          result: true,
          data: {
            sessionId: 'session-progress',
            partSize: 2,
            uploadedParts: [],
          },
          message: 'ok',
        })
      }
      if (url === '/files/uploads/session-progress/complete') {
        expect(init?.method).toBe('POST')
        return jsonResponse({
          result: true,
          data: { id: 'file-id', code: '123456' },
          message: 'ok',
        })
      }
      throw new Error(`unexpected fetch ${url}`)
    })
  const put = vi
    .spyOn(axios, 'put')
    .mockImplementation(async (url, data, config) => {
      expect(url).toMatch(/^\/files\/uploads\/session-progress\/parts\/\d$/)
      expect(config?.headers).toMatchObject({
        'Content-Type': 'application/octet-stream',
      })
      config?.onUploadProgress?.({
        bytes: 1,
        lengthComputable: true,
        loaded: 1,
        total: 2,
        progress: 0.5,
        upload: true,
      } as AxiosProgressEvent)
      await expect(new Response(data as BodyInit).text()).resolves.toMatch(
        /^[abcdef]{2}$/,
      )
      return {
        data: { result: true, data: { partNumber: 1 }, message: 'ok' },
      }
    })

  try {
    await expect(
      uploadFile(
        {
          data: new File(['abcdef'], 'hello.txt', { type: 'text/plain' }),
        },
        (event) => progress.push(event.loaded ?? 0),
      ),
    ).resolves.toMatchObject({ result: true })

    expect(fetchMock).toHaveBeenCalledWith('/files/uploads', expect.anything())
    expect(fetchMock).toHaveBeenCalledWith(
      '/files/uploads/session-progress/complete',
      expect.anything(),
    )
    expect(put).toHaveBeenCalledTimes(3)
    expect(put).toHaveBeenCalledWith(
      '/files/uploads/session-progress/parts/1',
      expect.any(Blob),
      expect.objectContaining({
        onUploadProgress: expect.any(Function),
      }),
    )
    expect(progress).toEqual([1, 2, 3, 4, 5, 6])
  } finally {
    Uploader.CHUNK_SIZE = originalChunkSize
    Uploader.MAX_UPLOAD_SIZE = originalMaxUploadSize
  }
})
