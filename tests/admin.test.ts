import { expect, test, vi } from 'vitest'

import { DeleteShare } from '../src/admin/deleteShare'

function createDeleteContext({
  db,
  kv,
  bucket,
}: {
  db: unknown
  kv: KVNamespace
  bucket?: R2Bucket
}) {
  return {
    env: {
      file_drops: kv,
      ...(bucket ? { FILES: bucket } : {}),
    },
    get: (key: string) => (key === 'db' ? db : undefined),
  }
}

test('admin delete removes R2 objects with the storage adapter', async () => {
  const returning = vi.fn().mockResolvedValue([
    {
      objectId: 'r2-object-1',
      storageProvider: 'r2',
    },
  ])
  const where = vi.fn(() => ({ returning }))
  const db = {
    delete: vi.fn(() => ({ where })),
  }
  const kv = {
    getWithMetadata: vi.fn(),
    delete: vi.fn(),
  } as unknown as KVNamespace
  const bucket = {
    delete: vi.fn(),
  } as unknown as R2Bucket
  const endpoint = new DeleteShare()
  vi.spyOn(endpoint, 'getValidatedData').mockResolvedValue({
    body: ['share-1'],
  } as never)

  await endpoint.handle(createDeleteContext({ db, kv, bucket }) as never)

  expect(bucket.delete).toHaveBeenCalledWith('r2-object-1')
  expect(kv.getWithMetadata).not.toHaveBeenCalled()
  expect(kv.delete).not.toHaveBeenCalledWith('r2-object-1')
})
