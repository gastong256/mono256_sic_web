import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'

/**
 * Wraps protected routes.
 * Redirects unauthenticated users to /login?returnTo=<current path>.
 * After login the user is redirected back (handled by useLogin hook).
 *
 * Usage in router.tsx:
 *   { element: <ProtectedRoute />, children: [...] }
 */
export function ProtectedRoute() {
  const { accessToken, refreshToken } = useAuthStore()
  const location = useLocation()

  // Allow through if either token is present: accessToken is memory-only and
  // cleared on page reload, but refreshToken is persisted. On first API call
  // from a protected page the 401 interceptor will transparently refresh.
  const isAuthenticated = Boolean(accessToken ?? refreshToken)

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }

  return <Outlet />
}
