import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'

export const ME_QUERY_KEY = ['me'] as const

/**
 * Fetches the current authenticated user profile.
 * Only runs when an access token is present in the store.
 * On 401, the http interceptor will attempt a token refresh automatically.
 */
export function useMe() {
  const { accessToken, setUser } = useAuthStore()

  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: async () => {
      const user = await authApi.me()
      setUser(user)
      return user
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
