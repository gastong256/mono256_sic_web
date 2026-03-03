import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { decodeJwtPayload } from '@/shared/lib/jwt'
import { logger } from '@/shared/lib/logger'

export function useLogin() {
  const { setTokens, setUser } = useAuthStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  return useMutation({
    mutationFn: authApi.login,

    onSuccess: async (data) => {
      // 1. Persist tokens in store
      setTokens(data.access, data.refresh)

      // 2. Decode is_staff and username from the SimpleJWT access token payload
      const payload = decodeJwtPayload(data.access)
      setUser({
        id: payload?.user_id ?? 0,
        username: payload?.username ?? '',
        email: '',
        first_name: '',
        last_name: '',
        is_staff: payload?.is_staff ?? false,
      })

      logger.info({ message: 'User logged in', userId: String(payload?.user_id) })

      // 3. Invalidate auth/business domains that may be stale after login
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['companies'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['journal'] }),
      ])

      // 4. Redirect: honour ?returnTo=, fall back to home
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
