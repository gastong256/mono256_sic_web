import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { logger } from '@/shared/lib/logger'

/**
 * Returns a logout handler that:
 *  1. Clears the auth store (tokens + user)
 *  2. Clears the TanStack Query cache (removes all private data)
 *  3. Redirects to /login
 */
export function useLogout() {
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return function handleLogout() {
    logger.info({ message: 'User logged out' })
    logout()
    queryClient.clear()
    void navigate('/login', { replace: true })
  }
}
