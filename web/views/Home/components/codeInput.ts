export function digitsOnly(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/[^0-9]/g, '')
}

export function applyDigits(values: string[], index: number, value: string) {
  const next = [...values]
  const digits = digitsOnly(value)
  for (
    let offset = 0;
    offset < digits.length && index + offset < next.length;
    offset += 1
  ) {
    next[index + offset] = digits[offset]
  }
  return {
    values: next,
    focusIndex: Math.min(index + Math.max(digits.length, 1), next.length - 1),
  }
}
