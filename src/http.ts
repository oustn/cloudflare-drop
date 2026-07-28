function asciiFilename(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, '').replace(/["\\]/g, '')
  return fallback || 'download'
}

export function contentDisposition(filename: string, inline = false) {
  if (inline) return 'inline'
  return `attachment; filename="${asciiFilename(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
}

export function responseContentType(type: string | null | undefined) {
  if (type === 'plain/string') return 'text/plain; charset=utf-8'
  if (type?.startsWith('text/') && !/;\s*charset=/i.test(type)) {
    return `${type}; charset=utf-8`
  }
  return type ?? 'application/octet-stream'
}

export function textResponse(message: string, status = 400) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
