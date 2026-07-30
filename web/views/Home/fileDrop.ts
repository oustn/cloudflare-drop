type DroppedEntry = {
  isDirectory?: boolean
}

type DroppedItem = {
  kind?: string
  webkitGetAsEntry?: () => DroppedEntry | null
}

export function hasDroppedFolder(
  dataTransfer: Pick<DataTransfer, 'items'> | null | undefined,
) {
  const items = dataTransfer?.items
  if (!items) return false

  return Array.from(items).some((item) => {
    const droppedItem = item as DroppedItem
    if (droppedItem.kind !== 'file') return false
    return droppedItem.webkitGetAsEntry?.()?.isDirectory === true
  })
}
