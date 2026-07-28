import { afterEach, expect, test, vi } from 'vitest'

import { FileCreate } from '../src/files/fileCreate'

afterEach(() => {
  vi.unstubAllGlobals()
})

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

function createContext({
  formData,
  bucket,
  kv,
  db,
}: {
  formData: FormData
  bucket: R2Bucket
  kv: KVNamespace
  db: unknown
}) {
  return {
    env: {
      SHARE_DURATION: '1hour',
      SHARE_MAX_SIZE_IN_MB: '100',
      STORAGE_DRIVER: 'r2',
      FILES: bucket,
      file_drops: kv,
    },
    req: {
      header: (name: string) =>
        name.toLowerCase() === 'content-type'
          ? 'multipart/form-data; boundary=test'
          : undefined,
      formData: async () => formData,
    },
    get: (key: string) => (key === 'db' ? db : undefined),
  }
}

test('plain text shares are stored in KV even when R2 is configured', async () => {
  const formData = new FormData()
  formData.append(
    'file',
    new Blob(['hello text'], { type: 'plain/string' }),
    'text.txt',
  )
  let storedText = ''
  const kv = {
    put: vi.fn(async (_key: string, value: ArrayBuffer) => {
      storedText = new TextDecoder().decode(value)
    }),
  } as unknown as KVNamespace
  const bucket = {
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as R2Bucket
  const { db, values } = createDb()

  const response = await new FileCreate().handle(
    createContext({ formData, bucket, kv, db }) as never,
  )

  expect(response).toMatchObject({ result: true })
  expect(storedText).toBe('hello text')
  expect(bucket.put).not.toHaveBeenCalled()
  expect(values).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'plain/string',
      storage_provider: 'kv',
    }),
  )
})
