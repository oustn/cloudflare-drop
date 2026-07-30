import { describe, expect, test } from 'vitest'

import { hasDroppedFolder } from '../web/views/Home/fileDrop'

function createDataTransferWithItems(
  items: Array<{
    kind?: string
    entry?: { isDirectory?: boolean } | null
  }>,
) {
  return {
    items: items.map((item) => ({
      kind: item.kind ?? 'file',
      webkitGetAsEntry: () => item.entry ?? null,
    })),
  } as unknown as DataTransfer
}

describe('file drop helpers', () => {
  test('detects dragged folder entries', () => {
    expect(
      hasDroppedFolder(
        createDataTransferWithItems([{ entry: { isDirectory: true } }]),
      ),
    ).toBe(true)
  })

  test('allows normal dragged files', () => {
    expect(
      hasDroppedFolder(
        createDataTransferWithItems([{ entry: { isDirectory: false } }]),
      ),
    ).toBe(false)
  })

  test('ignores non-file drag items', () => {
    expect(
      hasDroppedFolder(
        createDataTransferWithItems([
          { kind: 'string', entry: { isDirectory: true } },
        ]),
      ),
    ).toBe(false)
  })
})
