type HttpMetricInput = {
  method: string
  url: string
  status?: number
  durationMs: number
}

type HttpEndpointMetric = {
  method: string
  endpoint: string
  count: number
  errorCount: number
  totalDurationMs: number
  avgDurationMs: number
  minDurationMs: number
  maxDurationMs: number
  lastStatus?: number
}

type HttpMetricsStore = Record<string, HttpEndpointMetric>

const httpMetricsStore: HttpMetricsStore = {}

const SLOW_REQUEST_THRESHOLD_MS = 1200

function sanitizePath(path: string): string {
  return path
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
      '/:uuid'
    )
    .replace(/\/\d{4}-\d{2}-\d{2}(?=\/|$)/g, '/:date')
}

function normalizeEndpoint(url: string): string {
  try {
    const withBase = url.startsWith('http')
      ? url
      : `http://localhost${url.startsWith('/') ? '' : '/'}${url}`
    const parsed = new URL(withBase)
    return sanitizePath(parsed.pathname)
  } catch {
    return sanitizePath(url)
  }
}

function getMetricKey(method: string, endpoint: string): string {
  return `${method.toUpperCase()} ${endpoint}`
}

function attachMetricsToWindow(): void {
  if (typeof window === 'undefined') return
  const target = window as Window & { __HTTP_METRICS__?: HttpMetricsStore }
  target.__HTTP_METRICS__ = httpMetricsStore
}

export function recordHttpMetric(input: HttpMetricInput): HttpEndpointMetric {
  const method = input.method.toUpperCase()
  const endpoint = normalizeEndpoint(input.url)
  const key = getMetricKey(method, endpoint)
  const current = httpMetricsStore[key]
  const durationMs = Math.round(input.durationMs)
  const isError = typeof input.status === 'number' && input.status >= 400

  if (!current) {
    httpMetricsStore[key] = {
      method,
      endpoint,
      count: 1,
      errorCount: isError ? 1 : 0,
      totalDurationMs: durationMs,
      avgDurationMs: durationMs,
      minDurationMs: durationMs,
      maxDurationMs: durationMs,
      lastStatus: input.status,
    }
    attachMetricsToWindow()
    return httpMetricsStore[key]
  }

  current.count += 1
  current.errorCount += isError ? 1 : 0
  current.totalDurationMs += durationMs
  current.avgDurationMs = Math.round(current.totalDurationMs / current.count)
  current.minDurationMs = Math.min(current.minDurationMs, durationMs)
  current.maxDurationMs = Math.max(current.maxDurationMs, durationMs)
  current.lastStatus = input.status

  attachMetricsToWindow()
  return current
}

export function isSlowRequest(durationMs: number): boolean {
  return durationMs >= SLOW_REQUEST_THRESHOLD_MS
}
