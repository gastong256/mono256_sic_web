import { RouterProvider } from 'react-router'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { registerTokenProvider } from '@/shared/lib/http'
import { useAuthStore } from '@/features/auth/store/auth.store'

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
  logout: () => useAuthStore.getState().logout(),
})

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ErrorBoundary>
  )
}
