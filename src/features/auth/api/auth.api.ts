import { httpClient } from '@/shared/lib/http'
import type { User } from '@/shared/types'

// ── Request / Response types ──────────────────────────────────────────────────

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export type LoginResponse = AuthTokens

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
   * POST /auth/token/
   * Returns access and refresh tokens (DRF SimpleJWT).
   */
  login: (credentials: LoginCredentials): Promise<LoginResponse> =>
    httpClient.post<LoginResponse>('/auth/token/', credentials).then((r) => r.data),

  /**
   * POST /auth/token/refresh/
   * Called directly by the http.ts interceptor using bare axios.
   * Exposed here as well for explicit use if needed.
   */
  refresh: (refreshToken: string): Promise<AuthTokens> =>
    httpClient
      .post<AuthTokens>('/auth/token/refresh/', { refresh: refreshToken })
      .then((r) => r.data),

  /**
   * GET /me
   * Returns the current authenticated user. Requires Authorization header.
   */
  me: (): Promise<MeResponse> => httpClient.get<MeResponse>('/me').then((r) => r.data),
}
