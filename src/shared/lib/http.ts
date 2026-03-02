/**
 * Shared HTTP client — the ONLY Axios entrypoint in this codebase.
 *
 * Responsibilities:
 *  - Attach Authorization header (Bearer token)
 *  - Attach X-Request-ID header (session-scoped tracing)
 *  - On 401: attempt single token refresh, queue concurrent requests,
 *    retry after success, logout + redirect on failure.
 *
 * Auth integration:
 *  Call `registerTokenProvider` once at app startup (App.tsx) to wire
 *  the auth store into the HTTP client without creating a circular import.
 */

import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { env } from '@/shared/config/env'
import { getRequestId } from '@/shared/lib/tracing'
import { logger } from '@/shared/lib/logger'

// ── Token provider interface ──────────────────────────────────────────────────

export interface TokenProvider {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

let _tokenProvider: TokenProvider | null = null

/**
 * Register the auth store as the token provider.
 * Must be called before the first authenticated HTTP request.
 * Typically called at module-level in App.tsx.
 */
export function registerTokenProvider(provider: TokenProvider): void {
  _tokenProvider = provider
}

// ── Axios instance ────────────────────────────────────────────────────────────

export const httpClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

// ── Request interceptor — attach auth + tracing headers ───────────────────────

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = _tokenProvider?.getAccessToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  config.headers['X-Request-ID'] = getRequestId()

  logger.debug({
    message: 'HTTP request',
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
  })

  return config
})

// ── Refresh queue ─────────────────────────────────────────────────────────────

type RefreshQueueItem = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let refreshQueue: RefreshQueueItem[] = []

function processQueue(error: unknown, token: string | null = null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error !== null) {
      reject(error)
    } else if (token !== null) {
      resolve(token)
    }
  })
  refreshQueue = []
}

// ── Response interceptor — 401 → refresh → retry ─────────────────────────────

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined

    if (!originalRequest) return Promise.reject(error)

    // Auth endpoints return 401 for "wrong credentials" or "expired refresh token" —
    // not for "access token expired". Skip the refresh flow and let the error
    // propagate directly to the caller (e.g. LoginForm's onError handler).
    const isAuthEndpoint = /\/auth\/(login|refresh)/.test(originalRequest.url ?? '')
    if (isAuthEndpoint) return Promise.reject(error)

    // Only handle 401 Unauthorized — not already-retried requests
    if (error.response?.status !== 401 || originalRequest._retry === true) {
      logger.warn({
        message: 'HTTP error',
        status: error.response?.status,
        url: originalRequest.url,
      })
      return Promise.reject(error)
    }

    // Queue concurrent 401 requests while a refresh is in progress
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return httpClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = _tokenProvider?.getRefreshToken() ?? null

    if (!refreshToken) {
      logger.warn({ message: 'No refresh token — logging out' })
      processQueue(new Error('No refresh token'), null)
      isRefreshing = false
      _tokenProvider?.logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      logger.info({ message: 'Attempting token refresh' })

      // Use bare axios (NOT httpClient) to bypass our own interceptors
      // and avoid an infinite retry loop.
      const { data } = await axios.post<{
        access_token: string
        refresh_token: string
      }>(`${env.VITE_API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })

      _tokenProvider?.setTokens(data.access_token, data.refresh_token)
      logger.info({ message: 'Token refresh successful' })

      processQueue(null, data.access_token)

      originalRequest.headers.Authorization = `Bearer ${data.access_token}`
      return httpClient(originalRequest)
    } catch (refreshError) {
      logger.error({ message: 'Token refresh failed — logging out', error: String(refreshError) })
      processQueue(refreshError, null)
      _tokenProvider?.logout()
      window.location.href = '/login'
      return Promise.reject(refreshError instanceof Error ? refreshError : new Error(String(refreshError)))
    } finally {
      isRefreshing = false
    }
  },
)
