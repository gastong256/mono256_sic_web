export function extractFilenameFromContentDisposition(
  contentDispositionHeader: string | null | undefined
): string | null {
  if (!contentDispositionHeader) return null

  const utf8Match = contentDispositionHeader.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/["']/g, '').trim()
    } catch {
      return utf8Match[1].replace(/["']/g, '').trim()
    }
  }

  const asciiMatch = contentDispositionHeader.match(/filename="?([^"]+)"?/i)
  if (asciiMatch?.[1]) {
    return asciiMatch[1].trim()
  }

  return null
}

export function saveBlobAsFile(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

export function buildDefaultXlsxFilename(prefix: string): string {
  const now = new Date().toISOString().slice(0, 10)
  return `${prefix}-${now}.xlsx`
}
