import { KvStorage } from './kv'
import { R2Storage } from './r2'
import { FileStorage, StorageProvider } from './types'

export * from './types'
export { KvStorage } from './kv'
export { R2Storage } from './r2'

export function selectStorage(env: {
  STORAGE_DRIVER?: string
  FILES?: R2Bucket
  file_drops: KVNamespace
}): FileStorage {
  const driver = env.STORAGE_DRIVER ?? 'auto'
  if (driver === 'r2' && !env.FILES) {
    throw new Error('R2 storage is not configured')
  }
  if (driver !== 'kv' && env.FILES) {
    return new R2Storage(env.FILES)
  }
  return new KvStorage(env.file_drops)
}

export function storageForProvider(
  env: { FILES?: R2Bucket; file_drops: KVNamespace },
  provider: StorageProvider | string,
): FileStorage {
  if (provider === 'r2') {
    if (!env.FILES) throw new Error('R2 storage is not configured')
    return new R2Storage(env.FILES)
  }
  return new KvStorage(env.file_drops)
}
