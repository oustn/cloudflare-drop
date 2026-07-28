import { afterEach, expect, test, vi } from 'vitest'

import { FileCreate } from '../src/files/fileCreate'

afterEach(() => {
  vi.unstubAllGlobals()
})

async function readText(stream: ReadableStream<Uint8Array>) {
  return new Response(stream).text()
}

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

function stubFixedLengthStream() {
  const fixedLengths = new WeakMap<ReadableStream<Uint8Array>, number>()
  vi.stubGlobal(
    'FixedLengthStream',
    class FixedLengthStream extends TransformStream<Uint8Array, Uint8Array> {
      constructor(expectedLength: number) {
        let bytes = 0
        super({
          transform(chunk, controller) {
            bytes += chunk.byteLength
            if (bytes > expectedLength) {
              controller.error(new Error('stream exceeded fixed length'))
              return
            }
            controller.enqueue(chunk)
          },
          flush(controller) {
            if (bytes !== expectedLength) {
              controller.error(new Error('stream did not match fixed length'))
            }
          },
        })
        fixedLengths.set(this.readable, expectedLength)
      }
    },
  )
  return fixedLengths
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

test('R2 chunk finalization writes combined chunks with a fixed length stream', async () => {
  const fixedLengths = stubFixedLengthStream()
  const chunkData = new Map([
    ['chunk.0', new TextEncoder().encode('hello ')],
    ['chunk.1', new TextEncoder().encode('world')],
  ])
  const kv = {
    getWithMetadata: vi.fn(async (key: string) => ({
      metadata: {
        size: chunkData.get(key)?.byteLength,
        hash: 'sha',
      },
    })),
    get: vi.fn(async (key: string, type: string) => {
      expect(type).toBe('stream')
      const data = chunkData.get(key)
      return data ? new Blob([data]).stream() : null
    }),
    delete: vi.fn(),
  } as unknown as KVNamespace
  let storedText = ''
  const bucket = {
    put: vi.fn(async (_key: string, value: ReadableStream<Uint8Array>) => {
      if (fixedLengths.get(value) !== 11) {
        throw new TypeError('Provided readable stream must have a known length')
      }
      storedText = await readText(value)
    }),
    delete: vi.fn(),
  } as unknown as R2Bucket
  const { db, values } = createDb()
  const formData = new FormData()
  formData.append(
    'fileInfo',
    JSON.stringify({
      objectId: [{ objectId: 'chunk.0' }, { objectId: 'chunk.1' }],
      name: 'hello.txt',
      type: 'text/plain',
      size: 11,
      sha: 'sha',
    }),
  )

  const response = await new FileCreate().handle(
    createContext({ formData, bucket, kv, db }) as never,
  )

  expect(response).toMatchObject({ result: true })
  expect(storedText).toBe('hello world')
  expect(kv.delete).toHaveBeenCalledWith('chunk.0')
  expect(kv.delete).toHaveBeenCalledWith('chunk.1')
  expect(values).toHaveBeenCalledWith(
    expect.objectContaining({
      filename: 'hello.txt',
      type: 'text/plain',
      size: 11,
      hash: 'sha',
      storage_provider: 'r2',
    }),
  )
})
