import { useLocation } from 'react-router'
import { useMe } from '@/features/auth/hooks/useMe'

export function useAuthenticatedBootstrap() {
  const { pathname } = useLocation()
  const shouldIncludeRegistrationCode = pathname.startsWith('/profile')

  return useMe({
    include: shouldIncludeRegistrationCode
      ? ['companies', 'capabilities', 'registration_code']
      : ['companies', 'capabilities'],
  })
}
