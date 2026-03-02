import { getRequestId } from '@/shared/lib/tracing'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogPayload = {
  message: string
  [key: string]: unknown
}

type LogEntry = {
  timestamp: string
  request_id: string
  level: LogLevel
  message: string
  [key: string]: unknown
}

function buildEntry(level: LogLevel, payload: LogPayload | string): LogEntry {
  const base: LogPayload = typeof payload === 'string' ? { message: payload } : payload
  return {
    timestamp: new Date().toISOString(),
    request_id: getRequestId(),
    level,
    ...base,
  }
}

function emit(level: LogLevel, entry: LogEntry): void {
  const line = JSON.stringify(entry)
  if (level === 'error') {
    console.error(line)
  } else if (level === 'warn') {
    console.warn(line)
  } else if (level === 'debug') {
    console.debug(line)
  } else {
    console.info(line)
  }
}

function log(level: LogLevel, payload: LogPayload | string): void {
  const entry = buildEntry(level, payload)
  emit(level, entry)
}

export const logger = {
  debug: (payload: LogPayload | string) => log('debug', payload),
  info: (payload: LogPayload | string) => log('info', payload),
  warn: (payload: LogPayload | string) => log('warn', payload),
  error: (payload: LogPayload | string) => log('error', payload),
}
