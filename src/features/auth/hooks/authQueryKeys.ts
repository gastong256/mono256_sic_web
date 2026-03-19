import type { MeInclude } from '@/features/auth/api/auth.api'

function normalizeIncludes(include?: MeInclude[]): MeInclude[] {
  if (!include || include.length === 0) return []
  return Array.from(new Set(include)).sort()
}

export const authQueryKeys = {
  root: ['auth'] as const,
  me: (include?: MeInclude[]) => ['auth', 'me', normalizeIncludes(include).join(',')] as const,
}

export function buildAuthMeQueryKey(include?: MeInclude[]) {
  return authQueryKeys.me(include)
}
