import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/shared/types'

interface AuthState {
  /** Access token — held in memory only. Never written to localStorage. */
  accessToken: string | null

  /**
   * Refresh token — persisted to localStorage via Zustand persist.
   * In production, prefer an HttpOnly cookie set by the server instead.
   */
  refreshToken: string | null

  /** Authenticated user profile, populated after login or /me fetch. */
  user: User | null

  /** Store both tokens after a successful login or refresh. */
  setTokens: (accessToken: string, refreshToken: string) => void

  /** Store user profile. */
  setUser: (user: User) => void

  /** Clear all auth state (logout). */
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

      setUser: (user) => set({ user }),

      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'auth-storage',
      /**
       * Only persist the refresh token.
       * accessToken intentionally omitted — it lives in memory only.
       * On page reload the refresh token allows silent re-authentication.
       */
      partialize: (state) => ({
        refreshToken: state.refreshToken,
      }),
    },
  ),
)
