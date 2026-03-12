type UnknownRecord = Record<string, unknown>

export interface PaginationMeta {
  count: number | null
  next: string | null
  previous: string | null
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  return null
}

function toCountOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
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
    count: toCountOrNull(payload.count) ?? fallbackCount ?? null,
    next: toStringOrNull(payload.next),
    previous: toStringOrNull(payload.previous),
  }
}
