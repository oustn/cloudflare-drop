import { expect, test } from 'vitest'

import { files } from '../data/schemas/files.schema'

test('files persist provider and ephemeral claim state', () => {
  expect(files.storage_provider.name).toBe('storage_provider')
  expect(files.claimed_at.name).toBe('claimed_at')
})
