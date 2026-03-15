export type UnknownRecord = Record<string, unknown>

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

export function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function toStringOrNull(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  return null
}

export function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function toNullableNumberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = toNumberValue(value, Number.NaN)
  return Number.isFinite(parsed) ? parsed : null
}

export function toPositiveNumberValue(value: unknown): number | null {
  const parsed = toNullableNumberValue(value)
  return parsed !== null && parsed > 0 ? parsed : null
}

export function toDecimalString(value: unknown, fallback = '0'): string {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}
