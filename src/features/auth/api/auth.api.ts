import { httpClient } from '@/shared/lib/http'
import type { User } from '@/shared/types'
import { isAxiosError } from 'axios'

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

export interface RegisterPayload {
  username: string
  password: string
  password_confirm: string
  email?: string
  first_name?: string
  last_name?: string
  registration_code: string
}

export interface RegistrationCodeResponse {
  code: string
  window_minutes: number
  allow_previous_window: boolean
  valid_from: string
  valid_until: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
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
  me: (): Promise<User> => httpClient.get<User>('/auth/me/').then((r) => r.data),

  register: async (payload: RegisterPayload): Promise<User> => {
    const maxAttempts = 3
    let attempt = 0

    while (attempt < maxAttempts) {
      try {
        const { data } = await httpClient.post<User>('/auth/register/', payload)
        return data
      } catch (error) {
        attempt += 1
        if (!isAxiosError(error) || error.response?.status !== 429 || attempt >= maxAttempts) {
          throw error
        }

        const responseData = error.response?.data as { retry_after?: number } | undefined
        const retryAfterSec = Number(responseData?.retry_after)
        const baseMs =
          Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec * 1000 : 600
        const backoffMs = Math.max(baseMs, 2 ** attempt * 300)
        await sleep(backoffMs)
      }
    }

    throw new Error('No se pudo completar el registro.')
  },

  teacherRegistrationCode: (): Promise<RegistrationCodeResponse> =>
    httpClient.get<RegistrationCodeResponse>('/teacher/registration-code/').then((r) => r.data),

  adminRegistrationCode: (): Promise<RegistrationCodeResponse> =>
    httpClient.get<RegistrationCodeResponse>('/admin/registration-code/').then((r) => r.data),

  rotateRegistrationCode: (): Promise<RegistrationCodeResponse> =>
    httpClient
      .post<RegistrationCodeResponse>('/admin/registration-code/rotate/')
      .then((r) => r.data),
}
