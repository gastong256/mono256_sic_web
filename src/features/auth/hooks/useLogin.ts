import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'
import { accountChartQueryKeys } from '@/features/settings/hooks/accountChartQueryKeys'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'
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
        role: payload?.role ?? 'student',
      })

      logger.info({ message: 'User logged in', userId: String(payload?.user_id) })

      // 3. Invalidate auth/business domains that may be stale after login
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: companyQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: ['journal'] }),
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.root }),
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
        queryClient.invalidateQueries({ queryKey: accountChartQueryKeys.root }),
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
