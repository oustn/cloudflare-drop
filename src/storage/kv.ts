import { ChunkMetadata, FileStorage, StorageObject } from './types'

const KV_CHUNK_SIZE = 5 * 1024 * 1024

function chunkStream(
  kv: KVNamespace,
  chunks: ChunkMetadata[],
): ReadableStream<Uint8Array> {
  let index = 0
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  return new ReadableStream({
    async pull(controller) {
      try {
        while (true) {
          if (!reader) {
            const chunk = await kv.get(chunks[index]?.objectId, 'stream')
            if (!chunk) {
              throw new Error('Stored file chunk is missing')
            }
            reader = chunk.getReader()
          }

          const next = await reader.read()
          if (!next.done) {
            controller.enqueue(next.value)
            return
          }

          reader.releaseLock()
          reader = null
          index += 1
          if (index === chunks.length) {
            controller.close()
            return
          }
        }
      } catch (error) {
        controller.error(error)
      }
    },
    async cancel() {
      await reader?.cancel()
    },
  })
}

export class KvStorage implements FileStorage {
  readonly provider = 'kv' as const

  constructor(private readonly kv: KVNamespace) {}

  async get(key: string): Promise<StorageObject | null> {
    const { value, metadata } = await this.kv.getWithMetadata<ChunkMetadata[]>(
      key,
      'stream',
    )

    if (Array.isArray(metadata)) {
      return { body: chunkStream(this.kv, metadata) }
    }
    if (!value) return null
    return { body: value }
  }

  async put(
    key: string,
    value: ArrayBuffer | ReadableStream<Uint8Array>,
  ): Promise<void> {
    if (value instanceof ArrayBuffer && value.byteLength <= KV_CHUNK_SIZE) {
      await this.kv.put(key, value)
      return
    }

    const stream =
      value instanceof ArrayBuffer ? new Blob([value]).stream() : value
    const reader = stream.getReader()
    const chunks: ChunkMetadata[] = []
    let pending = new Uint8Array(0)

    const writeChunk = async (data: Uint8Array) => {
      const chunkId = chunks.length
      const objectId = `${key}.chunk.${chunkId}`
      await this.kv.put(objectId, data.slice())
      chunks.push({ objectId, chunkId })
    }

    try {
      while (true) {
        const { done, value: input } = await reader.read()
        if (done) break
        const combined = new Uint8Array(pending.byteLength + input.byteLength)
        combined.set(pending)
        combined.set(input, pending.byteLength)
        let offset = 0
        while (combined.byteLength - offset >= KV_CHUNK_SIZE) {
          await writeChunk(combined.slice(offset, offset + KV_CHUNK_SIZE))
          offset += KV_CHUNK_SIZE
        }
        pending = combined.slice(offset)
      }
      if (pending.byteLength) await writeChunk(pending)
      await this.kv.put(key, '', { metadata: chunks })
    } catch (error) {
      await Promise.all(chunks.map((chunk) => this.kv.delete(chunk.objectId)))
      throw error
    } finally {
      reader.releaseLock()
    }
  }

  async delete(key: string): Promise<void> {
    const { metadata } = await this.kv.getWithMetadata<ChunkMetadata[]>(key)
    if (Array.isArray(metadata)) {
      await Promise.all(metadata.map((chunk) => this.kv.delete(chunk.objectId)))
    }
    await this.kv.delete(key)
  }
}
