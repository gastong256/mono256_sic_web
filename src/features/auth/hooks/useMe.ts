import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { MeInclude } from '@/features/auth/api/auth.api'
import { buildAuthMeQueryKey, authQueryKeys } from '@/features/auth/hooks/authQueryKeys'

export const ME_QUERY_KEY = authQueryKeys.root

function normalizeIncludes(include?: MeInclude[]): MeInclude[] {
  if (!include || include.length === 0) return []
  return Array.from(new Set(include)).sort()
}

/**
 * Fetches the current authenticated user profile.
 * Only runs when an access token is present in the store.
 * On 401, the http interceptor will attempt a token refresh automatically.
 */
export function useMe(options?: { include?: MeInclude[]; enabled?: boolean }) {
  const { accessToken, setUser } = useAuthStore()
  const include = normalizeIncludes(options?.include)

  return useQuery({
    queryKey: buildAuthMeQueryKey(include),
    queryFn: async () => {
      const user = await authApi.me({ include })
      setUser(user)
      return user
    },
    enabled: (options?.enabled ?? true) && !!accessToken,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
