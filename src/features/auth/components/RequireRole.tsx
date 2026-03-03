import { Navigate, Outlet, useLocation } from 'react-router'
import type { Role } from '@/shared/types'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { hasRole } from '@/shared/lib/authorization'

interface RequireRoleProps {
  roles: Role[]
}

export function RequireRole({ roles }: RequireRoleProps) {
  const { accessToken, refreshToken, user } = useAuthStore()
  const location = useLocation()

  const isAuthenticated = Boolean(accessToken ?? refreshToken)

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }

  if (!hasRole(user, roles)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
