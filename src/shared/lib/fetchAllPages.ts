import { extractListPayload, extractPaginationMeta } from '@/shared/lib/apiPagination'

interface FetchAllPagesOptions {
  startPage?: number
  maxPages?: number
}

export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<unknown>,
  options: FetchAllPagesOptions = {}
): Promise<T[]> {
  const startPage = options.startPage ?? 1
  const maxPages = options.maxPages ?? 100
  const items: T[] = []

  let page = startPage
  let visited = 0

  while (visited < maxPages) {
    visited += 1

    const payload = await fetchPage(page)
    const pageItems = extractListPayload<T>(payload)
    const pageMeta = extractPaginationMeta(payload, pageItems.length)

    items.push(...pageItems)

    if (!pageMeta.next) break
    page += 1
  }

  return items
}
