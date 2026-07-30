export function digitsOnly(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/[^0-9]/g, '')
}

function extractCodeParam(value: string) {
  const match = /(?:[?&#]|^)code=([^&#\s]+)/i.exec(value)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch (_error) {
    return match[1]
  }
}

function isUrlLike(value: string) {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
}

export function extractShareCodeDigits(value: unknown) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  const codeParam = extractCodeParam(trimmed)
  if (codeParam !== null) return digitsOnly(codeParam)
  if (isUrlLike(trimmed)) return ''
  return digitsOnly(trimmed)
}

export function applyDigits(values: string[], index: number, value: string) {
  const next = [...values]
  const digits = extractShareCodeDigits(value)
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
