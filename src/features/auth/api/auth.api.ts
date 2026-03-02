import { httpClient } from '@/shared/lib/http'
import type { User } from '@/shared/types'

// ── Request / Response types ──────────────────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

export interface MeResponse {
  user: User
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * All auth API calls go through httpClient (shared/lib/http.ts).
 * The 401 → refresh → retry interceptor lives there; do not replicate it here.
 */
export const authApi = {
  /**
   * POST /auth/login
   * Returns access token, refresh token, and the authenticated user.
   */
  login: (credentials: LoginCredentials): Promise<LoginResponse> =>
    httpClient.post<LoginResponse>('/auth/login', credentials).then((r) => r.data),

  /**
   * POST /auth/refresh
   * Called directly by the http.ts interceptor using bare axios.
   * Exposed here as well for explicit use if needed.
   */
  refresh: (refreshToken: string): Promise<AuthTokens> =>
    httpClient
      .post<AuthTokens>('/auth/refresh', { refresh_token: refreshToken })
      .then((r) => r.data),

  /**
   * GET /me
   * Returns the current authenticated user. Requires Authorization header.
   */
  me: (): Promise<MeResponse> => httpClient.get<MeResponse>('/me').then((r) => r.data),
}
