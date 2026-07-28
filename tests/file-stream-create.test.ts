import { expect, test, vi } from 'vitest'

import { FileStreamCreate } from '../src/files/fileStreamCreate'

async function readText(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).text()
}

function createDb(
  returningValue = {
    hash: '',
    code: '123456',
    due_date: new Date('2026-01-01T00:00:00Z'),
    is_ephemeral: false,
    is_encrypted: true,
  },
) {
  const returning = vi.fn().mockResolvedValue([returningValue])
  const values = vi.fn(() => ({ returning }))
  const insert = vi.fn(() => ({ values }))
  return {
    db: { insert },
    insert,
    values,
    returning,
  }
}

function createContext({
  body = new Blob(['encrypted']).stream(),
  headers = {},
  storageDriver = 'r2',
  bucket,
  db,
}: {
  body?: ReadableStream<Uint8Array>
  headers?: Record<string, string>
  storageDriver?: 'kv' | 'r2'
  bucket?: R2Bucket
  db: unknown
}) {
  const normalized = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  )
  return {
    env: {
      SHARE_DURATION: '1hour',
      SHARE_MAX_SIZE_IN_MB: '100',
      STORAGE_DRIVER: storageDriver,
      file_drops: {},
      ...(bucket ? { FILES: bucket } : {}),
    },
    req: {
      raw: { body },
      header: (name: string) => normalized.get(name.toLowerCase()),
    },
    get: (key: string) => (key === 'db' ? db : undefined),
  }
}

test('encrypted stream uploads store the request body through the selected storage', async () => {
  let storedKey = ''
  let storedText = ''
  const bucket = {
    put: vi.fn(async (key: string, value: ReadableStream<Uint8Array>) => {
      storedKey = key
      storedText = await readText(value)
    }),
    delete: vi.fn(),
  } as unknown as R2Bucket
  const { db, values } = createDb()
  const endpoint = new FileStreamCreate()

  const response = await endpoint.handle(
    createContext({
      bucket,
      db,
      headers: {
        'x-plaintext-size': '9',
        'x-share-duration': '1day',
        'x-share-ephemeral': 'true',
      },
    }) as never,
  )

  expect(response).toMatchObject({ result: true })
  expect(bucket.put).toHaveBeenCalledWith(storedKey, expect.any(ReadableStream))
  expect(storedText).toBe('encrypted')
  expect(values).toHaveBeenCalledWith(
    expect.objectContaining({
      filename: 'encrypted-file',
      type: 'application/octet-stream',
      size: 9,
      is_ephemeral: true,
      is_encrypted: true,
      storage_provider: 'r2',
    }),
  )
})

test('KV encrypted stream uploads reject plaintext files over 50MB before reading the body', async () => {
  const body = new ReadableStream<Uint8Array>({
    pull() {
      throw new Error('body should not be read')
    },
  })
  const { db } = createDb()
  const endpoint = new FileStreamCreate()

  const response = await endpoint.handle(
    createContext({
      body,
      db,
      storageDriver: 'kv',
      headers: {
        'x-plaintext-size': `${50 * 1000 * 1000 + 1}`,
      },
    }) as never,
  )

  expect(response).toMatchObject({
    result: false,
    message: 'KV 加密分享暂不支持大于 50M 的文件',
  })
})

test('encrypted stream uploads reject malformed plaintext size headers', async () => {
  const { db } = createDb()
  const endpoint = new FileStreamCreate()

  const response = await endpoint.handle(
    createContext({
      db,
      headers: {
        'x-plaintext-size': '123abc',
      },
    }) as never,
  )

  expect(response).toMatchObject({
    result: false,
    message: '文件大小信息缺失',
  })
})
