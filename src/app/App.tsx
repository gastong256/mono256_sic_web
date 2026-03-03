import { useEffect } from 'react'
import axios from 'axios'
import { RouterProvider } from 'react-router'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { registerTokenProvider } from '@/shared/lib/http'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { decodeJwtPayload } from '@/shared/lib/jwt'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { env } from '@/shared/config/env'
import { logger } from '@/shared/lib/logger'
import { ToastProvider } from '@/shared/ui/ToastProvider'

function setUserFromToken(accessToken: string): void {
  const payload = decodeJwtPayload(accessToken)
  if (!payload) return

  useAuthStore.getState().setUser({
    id: payload.user_id ?? 0,
    username: payload.username ?? '',
    email: '',
    first_name: '',
    last_name: '',
    is_staff: payload.is_staff ?? false,
    role: payload.role ?? 'student',
  })
}

/**
 * Wire the auth store into the HTTP client at module-load time.
 * This runs once before any components mount, ensuring the
 * Authorization header and refresh logic are active for all requests.
 *
 * Placed here (app layer) so that:
 *  - shared/lib/http has no direct import of features/
 *  - features/auth has no circular dependency on http
 */
registerTokenProvider({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  setTokens: (access, refresh) => useAuthStore.getState().setTokens(access, refresh),
  logout: () => {
    useAuthStore.getState().logout()
    useActiveCompanyStore.getState().setActiveCompanyId(null)
  },
  onTokensRefreshed: setUserFromToken,
})

export function App() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const setTokens = useAuthStore((s) => s.setTokens)
  const logout = useAuthStore((s) => s.logout)
  const setActiveCompanyId = useActiveCompanyStore((s) => s.setActiveCompanyId)

  useEffect(() => {
    if (accessToken || !refreshToken) return

    let cancelled = false

    void axios
      .post<{ access: string; refresh: string }>(`${env.VITE_API_BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      })
      .then(({ data }) => {
        if (cancelled) return
        setTokens(data.access, data.refresh)
        setUserFromToken(data.access)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        logger.warn({ message: 'Initial session refresh failed', error: String(error) })
        logout()
        setActiveCompanyId(null)
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, refreshToken, setTokens, logout, setActiveCompanyId])

  return (
    <ErrorBoundary>
      <QueryProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}
