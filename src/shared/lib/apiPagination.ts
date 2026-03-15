import { isRecord, toNumberValue, toStringOrNull } from '@/shared/lib/valueParsers'

export interface PaginationMeta {
  count: number | null
  next: string | null
  previous: string | null
}

export function extractListPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!isRecord(payload)) return []

  const results = payload.results
  if (Array.isArray(results)) return results as T[]

  const data = payload.data
  if (Array.isArray(data)) return data as T[]

  return []
}

export function extractPaginationMeta(payload: unknown, fallbackCount?: number): PaginationMeta {
  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      previous: null,
    }
  }

  if (!isRecord(payload)) {
    return {
      count: fallbackCount ?? null,
      next: null,
      previous: null,
    }
  }

  return {
    count: (() => {
      const parsedCount = toNumberValue(payload.count, Number.NaN)
      return Number.isFinite(parsedCount) ? parsedCount : (fallbackCount ?? null)
    })(),
    next: toStringOrNull(payload.next),
    previous: toStringOrNull(payload.previous),
  }
}
