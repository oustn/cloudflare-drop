const CODE_SPACE = 1_000_000
const MAX_UNBIASED_VALUE = Math.floor(0x1_0000_0000 / CODE_SPACE) * CODE_SPACE

export function createNumericShareCode() {
  let value = MAX_UNBIASED_VALUE
  while (value >= MAX_UNBIASED_VALUE) {
    value = crypto.getRandomValues(new Uint32Array(1))[0]
  }
  return (value % CODE_SPACE).toString().padStart(6, '0')
}

export function isUniqueCodeConstraint(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /unique constraint failed: files\.code|sqlite_constraint/i.test(
    message,
  )
}
