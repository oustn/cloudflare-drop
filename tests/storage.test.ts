import { expect, test } from 'vitest'

import { KvStorage, R2Storage, selectStorage } from '../src/storage'

class MemoryKv {
  private readonly values = new Map<string, BlobPart>()
  private readonly metadata = new Map<string, unknown>()

  async put(key: string, value: BlobPart, options?: { metadata?: unknown }) {
    this.values.set(key, value)
    this.metadata.set(key, options?.metadata ?? null)
  }

  async getWithMetadata(key: string, _type: 'stream') {
    const value = this.values.get(key)
    return {
      value: value
        ? (new Blob([value]).stream() as ReadableStream<Uint8Array>)
        : null,
      metadata: this.metadata.get(key) ?? null,
    }
  }

  async get(key: string, _type: 'stream') {
    const value = this.values.get(key)
    return value
      ? (new Blob([value]).stream() as ReadableStream<Uint8Array>)
      : null
  }

  async delete(key: string) {
    this.values.delete(key)
  }
}

async function readText(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) return null
  return new Response(stream).text()
}

test('auto storage prefers R2 only when it is bound', () => {
  const kv = new MemoryKv() as unknown as KVNamespace
  const r2 = {} as R2Bucket

  expect(
    selectStorage({ STORAGE_DRIVER: 'auto', FILES: r2, file_drops: kv }),
  ).toBeInstanceOf(R2Storage)
  expect(
    selectStorage({ STORAGE_DRIVER: 'auto', file_drops: kv }),
  ).toBeInstanceOf(KvStorage)
})

test('KV chunk metadata is streamed in order', async () => {
  const kv = new MemoryKv()
  await kv.put('file', 'chunks', {
    metadata: [{ objectId: 'part-0' }, { objectId: 'part-1' }],
  })
  await kv.put('part-0', 'one')
  await kv.put('part-1', 'two')

  const object = await new KvStorage(kv as unknown as KVNamespace).get('file')
  await expect(readText(object?.body ?? null)).resolves.toBe('onetwo')
})

test('KV storage splits streamed objects and reads them back in order', async () => {
  const kv = new MemoryKv()
  const storage = new KvStorage(kv as unknown as KVNamespace)
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('one'))
      controller.enqueue(new TextEncoder().encode('two'))
      controller.close()
    },
  })

  await storage.put('file', source)

  const object = await storage.get('file')
  await expect(readText(object?.body ?? null)).resolves.toBe('onetwo')
})

test('KV storage uses the same 5MiB chunk boundary as upload sessions', async () => {
  const kv = new MemoryKv()
  const storage = new KvStorage(kv as unknown as KVNamespace)

  await storage.put('file', new Uint8Array(5 * 1024 * 1024 + 1).buffer)

  const { metadata } = await kv.getWithMetadata('file', 'stream')
  expect(metadata).toEqual([
    { objectId: 'file.chunk.0', chunkId: 0 },
    { objectId: 'file.chunk.1', chunkId: 1 },
  ])
  await expect(
    new Response(await kv.get('file.chunk.0', 'stream')).arrayBuffer(),
  ).resolves.toHaveProperty('byteLength', 5 * 1024 * 1024)
  await expect(
    new Response(await kv.get('file.chunk.1', 'stream')).arrayBuffer(),
  ).resolves.toHaveProperty('byteLength', 1)
})
