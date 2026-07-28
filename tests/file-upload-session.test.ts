import { expect, test, vi } from 'vitest'

import {
  FileUploadSessionComplete,
  FileUploadSessionCreate,
  FileUploadSessionPartCreate,
  UPLOAD_SESSION_PART_SIZE,
} from '../src/files/fileUploadSession'

function createDb(
  returningValue = {
    hash: 'sha',
    code: '123456',
    due_date: new Date('2026-01-01T00:00:00Z'),
    is_ephemeral: false,
    is_encrypted: false,
  },
) {
  const returning = vi.fn().mockResolvedValue([returningValue])
  const values = vi.fn(() => ({ returning }))
  const insert = vi.fn(() => ({ values }))
  return {
    db: { insert },
    values,
  }
}

function createJsonContext({
  payload,
  kv,
  bucket,
  db,
  storageDriver = 'r2',
}: {
  payload: unknown
  kv: KVNamespace
  bucket?: R2Bucket
  db?: unknown
  storageDriver?: 'kv' | 'r2'
}) {
  return {
    env: {
      SHARE_DURATION: '1hour',
      SHARE_MAX_SIZE_IN_MB: '100',
      STORAGE_DRIVER: storageDriver,
      file_drops: kv,
      ...(bucket ? { FILES: bucket } : {}),
    },
    req: {
      json: async () => payload,
    },
    get: (key: string) => (key === 'db' ? db : undefined),
  }
}

function createParamContext({
  sessionId = 'session-1',
  partNumber = '1',
  body = new Blob(['hello']).stream(),
  kv,
  bucket,
  db,
  storageDriver = 'r2',
}: {
  sessionId?: string
  partNumber?: string
  body?: ReadableStream<Uint8Array>
  kv: KVNamespace
  bucket?: R2Bucket
  db?: unknown
  storageDriver?: 'kv' | 'r2'
}) {
  return {
    env: {
      SHARE_DURATION: '1hour',
      SHARE_MAX_SIZE_IN_MB: '100',
      STORAGE_DRIVER: storageDriver,
      file_drops: kv,
      ...(bucket ? { FILES: bucket } : {}),
    },
    req: {
      raw: { body },
      arrayBuffer: async () => new Response(body).arrayBuffer(),
      param: (name: string) =>
        name === 'sessionId'
          ? sessionId
          : name === 'partNumber'
            ? partNumber
            : undefined,
    },
    get: (key: string) => (key === 'db' ? db : undefined),
  }
}

test('R2 upload sessions initialize a multipart upload without exposing storage details to the client', async () => {
  let storedManifest = ''
  const kv = {
    put: vi.fn(async (_key: string, value: string) => {
      storedManifest = value
    }),
  } as unknown as KVNamespace
  const bucket = {
    createMultipartUpload: vi.fn(async () => ({
      uploadId: 'upload-1',
    })),
  } as unknown as R2Bucket

  const response = await new FileUploadSessionCreate().handle(
    createJsonContext({
      kv,
      bucket,
      payload: {
        filename: 'movie.ipa',
        type: '',
        size: 29_817_420,
        hash: 'sha',
        duration: '',
        isEphemeral: false,
        isEncrypted: false,
      },
    }) as never,
  )

  expect(response).toMatchObject({
    result: true,
    data: {
      partSize: UPLOAD_SESSION_PART_SIZE,
      uploadedParts: [],
    },
  })
  expect(bucket.createMultipartUpload).toHaveBeenCalled()
  expect(JSON.parse(storedManifest)).toMatchObject({
    provider: 'r2',
    uploadId: 'upload-1',
    filename: 'movie.ipa',
    size: 29_817_420,
  })
})

test('R2 upload parts are proxied directly to R2 multipart uploads', async () => {
  const manifest = {
    sessionId: 'session-1',
    provider: 'r2',
    objectId: 'object-1',
    uploadId: 'upload-1',
    filename: 'movie.ipa',
    type: '',
    size: 10,
    hash: 'sha',
    duration: '',
    isEphemeral: false,
    isEncrypted: false,
    partSize: 5,
    uploadedParts: [],
  }
  let storedManifest = manifest
  const uploadPart = vi.fn(
    async (_partNumber: number, value: ReadableStream) => {
      await expect(new Response(value).text()).resolves.toBe('hello')
      return { partNumber: 1, etag: 'etag-1' }
    },
  )
  const kv = {
    get: vi.fn(async () => JSON.stringify(storedManifest)),
    put: vi.fn(async (_key: string, value: string) => {
      storedManifest = JSON.parse(value)
    }),
  } as unknown as KVNamespace
  const bucket = {
    resumeMultipartUpload: vi.fn(() => ({ uploadPart })),
  } as unknown as R2Bucket

  const response = await new FileUploadSessionPartCreate().handle(
    createParamContext({ kv, bucket }) as never,
  )

  expect(response).toMatchObject({
    result: true,
    data: { partNumber: 1, etag: 'etag-1' },
  })
  expect(bucket.resumeMultipartUpload).toHaveBeenCalledWith(
    'object-1',
    'upload-1',
  )
  expect(storedManifest.uploadedParts).toEqual([
    { partNumber: 1, etag: 'etag-1' },
  ])
})

test('R2 upload completion completes multipart and writes the share record', async () => {
  const manifest = {
    sessionId: 'session-1',
    provider: 'r2',
    objectId: 'object-1',
    uploadId: 'upload-1',
    filename: 'movie.ipa',
    type: '',
    size: 10,
    hash: 'sha',
    duration: '',
    isEphemeral: false,
    isEncrypted: false,
    partSize: 5,
    uploadedParts: [
      { partNumber: 1, etag: 'etag-1' },
      { partNumber: 2, etag: 'etag-2' },
    ],
  }
  const complete = vi.fn()
  const kv = {
    get: vi.fn(async () => JSON.stringify(manifest)),
    delete: vi.fn(),
  } as unknown as KVNamespace
  const bucket = {
    resumeMultipartUpload: vi.fn(() => ({ complete })),
  } as unknown as R2Bucket
  const { db, values } = createDb()

  const response = await new FileUploadSessionComplete().handle(
    createParamContext({
      sessionId: 'session-1',
      kv,
      bucket,
      db,
    }) as never,
  )

  expect(response).toMatchObject({ result: true })
  expect(complete).toHaveBeenCalledWith([
    { partNumber: 1, etag: 'etag-1' },
    { partNumber: 2, etag: 'etag-2' },
  ])
  expect(values).toHaveBeenCalledWith(
    expect.objectContaining({
      objectId: 'object-1',
      storage_provider: 'r2',
      filename: 'movie.ipa',
    }),
  )
  expect(kv.delete).toHaveBeenCalled()
})

test('missing upload sessions return an API error instead of throwing', async () => {
  const kv = {
    get: vi.fn(async () => null),
  } as unknown as KVNamespace

  await expect(
    new FileUploadSessionPartCreate().handle(
      createParamContext({ kv }) as never,
    ),
  ).resolves.toMatchObject({
    result: false,
    message: '上传会话不存在',
  })

  await expect(
    new FileUploadSessionComplete().handle(createParamContext({ kv }) as never),
  ).resolves.toMatchObject({
    result: false,
    message: '上传会话不存在',
  })
})

test('encrypted upload sessions validate encrypted bytes but persist plaintext size', async () => {
  const manifests = new Map<string, string>()
  const { db, values } = createDb()
  const kv = {
    put: vi.fn(
      async (key: string, value: unknown, _options?: KVNamespacePutOptions) => {
        if (key.startsWith('upload-session:'))
          manifests.set(key, value as string)
      },
    ),
    get: vi.fn(async (key: string) => manifests.get(key) ?? null),
    delete: vi.fn(),
  } as unknown as KVNamespace

  const init = await new FileUploadSessionCreate().handle(
    createJsonContext({
      kv,
      storageDriver: 'kv',
      payload: {
        filename: 'encrypted-file',
        type: 'application/octet-stream',
        size: UPLOAD_SESSION_PART_SIZE + 5,
        plaintextSize: 123,
        hash: '',
        duration: '',
        isEphemeral: false,
        isEncrypted: true,
      },
    }) as never,
  )
  const sessionId = (init.data as { sessionId: string }).sessionId

  await new FileUploadSessionPartCreate().handle(
    createParamContext({
      sessionId,
      partNumber: '1',
      body: new Blob([new Uint8Array(UPLOAD_SESSION_PART_SIZE)]).stream(),
      kv,
      storageDriver: 'kv',
    }) as never,
  )
  await new FileUploadSessionPartCreate().handle(
    createParamContext({
      sessionId,
      partNumber: '2',
      body: new Blob(['12345']).stream(),
      kv,
      storageDriver: 'kv',
    }) as never,
  )

  const complete = await new FileUploadSessionComplete().handle(
    createParamContext({ sessionId, kv, db, storageDriver: 'kv' }) as never,
  )

  expect(complete).toMatchObject({ result: true })
  expect(values).toHaveBeenCalledWith(
    expect.objectContaining({
      filename: 'encrypted-file',
      size: 123,
      is_encrypted: true,
    }),
  )
})

test('KV upload sessions store parts as final chunks and complete with chunk metadata', async () => {
  const manifests = new Map<string, string>()
  const puts: Array<{
    key: string
    value: unknown
    options?: KVNamespacePutOptions
  }> = []
  const { db, values } = createDb()
  const kv = {
    put: vi.fn(
      async (key: string, value: unknown, options?: KVNamespacePutOptions) => {
        puts.push({ key, value, options })
        if (key.startsWith('upload-session:'))
          manifests.set(key, value as string)
      },
    ),
    get: vi.fn(async (key: string) => manifests.get(key) ?? null),
    delete: vi.fn(),
  } as unknown as KVNamespace

  const init = await new FileUploadSessionCreate().handle(
    createJsonContext({
      kv,
      storageDriver: 'kv',
      payload: {
        filename: 'movie.ipa',
        type: '',
        size: UPLOAD_SESSION_PART_SIZE + 5,
        hash: 'sha',
        duration: '',
        isEphemeral: false,
        isEncrypted: false,
      },
    }) as never,
  )
  const sessionId = (init.data as { sessionId: string }).sessionId

  await new FileUploadSessionPartCreate().handle(
    createParamContext({
      sessionId,
      partNumber: '1',
      body: new Blob([new Uint8Array(UPLOAD_SESSION_PART_SIZE)]).stream(),
      kv,
      storageDriver: 'kv',
    }) as never,
  )
  await new FileUploadSessionPartCreate().handle(
    createParamContext({
      sessionId,
      partNumber: '2',
      body: new Blob(['world']).stream(),
      kv,
      storageDriver: 'kv',
    }) as never,
  )

  const complete = await new FileUploadSessionComplete().handle(
    createParamContext({ sessionId, kv, db, storageDriver: 'kv' }) as never,
  )

  expect(complete).toMatchObject({ result: true })
  expect(values).toHaveBeenCalledWith(
    expect.objectContaining({
      storage_provider: 'kv',
      filename: 'movie.ipa',
    }),
  )
  expect(puts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: expect.stringMatching(/\.chunk\.0$/),
      }),
      expect.objectContaining({
        key: expect.stringMatching(/\.chunk\.1$/),
      }),
      expect.objectContaining({
        key: expect.not.stringMatching(/upload-session:/),
        value: '',
        options: {
          metadata: expect.arrayContaining([
            expect.objectContaining({ chunkId: 0 }),
            expect.objectContaining({ chunkId: 1 }),
          ]),
        },
      }),
    ]),
  )
})
