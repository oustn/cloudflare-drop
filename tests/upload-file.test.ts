import { afterEach, expect, test, vi } from 'vitest'
import axios from 'axios'

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
      if (url === '/files/uploads/encrypted-session/parts/1') {
        expect(init?.method).toBe('PUT')
        await expect(new Response(init?.body as BodyInit).text()).resolves.toBe(
          'ab',
        )
        return jsonResponse({ result: true, data: { partNumber: 1 } })
      }
      if (url === '/files/uploads/encrypted-session/parts/2') {
        expect(init?.method).toBe('PUT')
        await expect(new Response(init?.body as BodyInit).text()).resolves.toBe(
          'cd',
        )
        return jsonResponse({ result: true, data: { partNumber: 2 } })
      }
      if (url === '/files/uploads/encrypted-session/parts/3') {
        expect(init?.method).toBe('PUT')
        await expect(new Response(init?.body as BodyInit).text()).resolves.toBe(
          'ef',
        )
        return jsonResponse({ result: true, data: { partNumber: 3 } })
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
  const put = vi.spyOn(axios, 'put')
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
      if (url === '/files/uploads/session-1/parts/1') {
        expect(init?.method).toBe('PUT')
        await expect(new Response(init?.body as BodyInit).text()).resolves.toBe(
          'ab',
        )
        return jsonResponse({ result: true, data: { partNumber: 1 } })
      }
      if (url === '/files/uploads/session-1/parts/2') {
        expect(init?.method).toBe('PUT')
        await expect(new Response(init?.body as BodyInit).text()).resolves.toBe(
          'cd',
        )
        return jsonResponse({ result: true, data: { partNumber: 2 } })
      }
      if (url === '/files/uploads/session-1/parts/3') {
        expect(init?.method).toBe('PUT')
        await expect(new Response(init?.body as BodyInit).text()).resolves.toBe(
          'ef',
        )
        return jsonResponse({ result: true, data: { partNumber: 3 } })
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
