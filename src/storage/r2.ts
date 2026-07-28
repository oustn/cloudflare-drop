import { FileStorage, StorageObject } from './types'

export class R2Storage implements FileStorage {
  readonly provider = 'r2' as const

  constructor(private readonly bucket: R2Bucket) {}

  async get(key: string): Promise<StorageObject | null> {
    const object = await this.bucket.get(key)
    if (!object?.body) return null
    return { body: object.body }
  }

  async put(
    key: string,
    value: ArrayBuffer | ReadableStream<Uint8Array>,
  ): Promise<void> {
    await this.bucket.put(key, value)
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key)
  }
}
