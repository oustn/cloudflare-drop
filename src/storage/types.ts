export type StorageProvider = 'kv' | 'r2'

export interface StorageObject {
  body: ReadableStream<Uint8Array>
}

export interface FileStorage {
  readonly provider: StorageProvider
  get(key: string): Promise<StorageObject | null>
  put(
    key: string,
    value: ArrayBuffer | ReadableStream<Uint8Array>,
  ): Promise<void>
  delete(key: string): Promise<void>
}

export interface ChunkMetadata {
  objectId: string
  chunkId?: number
}
