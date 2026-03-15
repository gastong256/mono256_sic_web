import { isAxiosError, type AxiosError } from 'axios'
import { isRecord, toPositiveNumberValue, type UnknownRecord } from '@/shared/lib/valueParsers'

type HttpErrorMessages = {
  defaultMessage: string
  badRequestMessage?: string
  unauthorizedMessage?: string
  forbiddenMessage?: string
  notFoundMessage?: string
  conflictMessage?: string
  rateLimitMessage?: string
  serverErrorMessage?: string
}

function firstString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = firstString(item)
      if (candidate) return candidate
    }
  }
  return null
}

function readErrorEnvelope(payload: unknown): UnknownRecord | null {
  if (!isRecord(payload)) return null
  return isRecord(payload.error) ? payload.error : null
}

function getAxiosPayload(error: AxiosError<unknown>): unknown {
  return error.response?.data
}

function getRetryAfterHeader(error: AxiosError<unknown>): string | number | null {
  const headers: unknown = error.response?.headers
  if (!isRecord(headers)) return null
  const value = headers['retry-after']
  if (typeof value === 'string' || typeof value === 'number') return value
  if (Array.isArray(value)) {
    const first = (value as unknown[])[0]
    return typeof first === 'string' || typeof first === 'number' ? first : null
  }
  return null
}

export function extractApiMessage(error: unknown): string | null {
  if (!isAxiosError<unknown>(error)) return null
  const payload = getAxiosPayload(error)
  const envelope = readErrorEnvelope(payload)
  const payloadRecord = isRecord(payload) ? payload : null

  // Required priority:
  // error.message > error.detail(string) > detail > message > error > fallback
  const candidate =
    firstString(envelope?.message) ??
    firstString(envelope?.detail) ??
    firstString(payloadRecord?.detail) ??
    firstString(payloadRecord?.message) ??
    firstString(payloadRecord?.error)

  return candidate
}

function normalizeFieldErrorValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (Array.isArray(value)) return normalizeFieldErrorValue(value[0])
  return null
}

export function extractFieldValidationErrors(error: unknown): Record<string, string> {
  if (!isAxiosError<unknown>(error)) return {}
  const payload = getAxiosPayload(error)
  if (!isRecord(payload)) return {}

  const envelope = readErrorEnvelope(payload)
  const detail =
    envelope && isRecord(envelope.detail)
      ? envelope.detail
      : isRecord(payload.detail)
        ? payload.detail
        : payload

  if (!isRecord(detail)) return {}

  const out: Record<string, string> = {}
  Object.entries(detail).forEach(([field, value]) => {
    const normalized = normalizeFieldErrorValue(value)
    if (normalized) out[field] = normalized
  })

  return out
}

export function getRetryAfterSeconds(error: unknown): number | null {
  if (!isAxiosError<unknown>(error)) return null

  const headerRaw = getRetryAfterHeader(error)
  const parsedHeader = toPositiveNumberValue(headerRaw)
  if (parsedHeader !== null) return parsedHeader

  const payload = getAxiosPayload(error)
  const payloadRecord = isRecord(payload) ? payload : null
  const topLevelRetryAfter = toPositiveNumberValue(payloadRecord?.retry_after)
  if (topLevelRetryAfter !== null) return topLevelRetryAfter

  const envelope = readErrorEnvelope(payload)
  const detail = envelope?.detail

  const detailRetryAfter = isRecord(detail)
    ? toPositiveNumberValue(detail.retry_after)
    : toPositiveNumberValue(detail)
  if (detailRetryAfter !== null) return detailRetryAfter

  if (payloadRecord && isRecord(payloadRecord.detail)) {
    const payloadDetailRetryAfter = toPositiveNumberValue(payloadRecord.detail.retry_after)
    if (payloadDetailRetryAfter !== null) return payloadDetailRetryAfter
  }

  const asString = firstString(detail)
  if (asString) {
    const parsedFromText = toPositiveNumberValue(asString)
    if (parsedFromText !== null) return parsedFromText
  }

  return null
}

export function getHttpErrorMessage(error: unknown, messages: HttpErrorMessages): string {
  if (!isAxiosError(error)) return messages.defaultMessage

  const status = error.response?.status
  if (status === undefined) {
    return 'No hay conexión con el servidor. Verificá tu red e intentá nuevamente.'
  }

  const apiMessage = extractApiMessage(error)

  if (status >= 500)
    return messages.serverErrorMessage ?? apiMessage ?? 'El servidor no pudo procesar la solicitud.'
  if (status === 429)
    return (
      messages.rateLimitMessage ??
      apiMessage ??
      'Demasiadas solicitudes. Esperá unos segundos e intentá de nuevo.'
    )
  if (status === 409) return messages.conflictMessage ?? apiMessage ?? messages.defaultMessage
  if (status === 404) return messages.notFoundMessage ?? apiMessage ?? messages.defaultMessage
  if (status === 403) return messages.forbiddenMessage ?? apiMessage ?? messages.defaultMessage
  if (status === 401)
    return messages.unauthorizedMessage ?? 'Tu sesión expiró. Iniciá sesión nuevamente.'
  if (status === 400) return messages.badRequestMessage ?? apiMessage ?? messages.defaultMessage

  return apiMessage ?? messages.defaultMessage
}
