import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { logger } from '@/shared/lib/logger'

export function useLogin() {
  const { setTokens, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useMutation({
    mutationFn: authApi.login,

    onSuccess: async (data) => {
      // 1. Persist tokens and user in store
      setTokens(data.access_token, data.refresh_token)
      setUser(data.user)

      logger.info({ message: 'User logged in', userId: data.user.id })

      // 2. Invalidate all stale queries so protected pages refetch with new token
      await queryClient.invalidateQueries()

      // 3. Redirect: honour ?returnTo=, fall back to home
      const returnTo = searchParams.get('returnTo') ?? '/'
      // Sanitise: only allow internal paths (prevent open redirect)
      const safePath = returnTo.startsWith('/') ? returnTo : '/'
      void navigate(safePath, { replace: true })
    },

    onError: (error) => {
      logger.warn({ message: 'Login failed', error: String(error) })
    },
  })
}
