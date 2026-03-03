import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'

export const REGISTRATION_CODE_QUERY_KEY = ['registration-code'] as const

export function useRegistrationCode() {
  const role = useAuthStore((state) => state.user?.role)

  return useQuery({
    queryKey: [...REGISTRATION_CODE_QUERY_KEY, role ?? 'none'] as const,
    queryFn: () =>
      role === 'admin' ? authApi.adminRegistrationCode() : authApi.teacherRegistrationCode(),
    enabled: role === 'admin' || role === 'teacher',
    staleTime: 5_000,
    gcTime: 60_000,
  })
}

export function useRotateRegistrationCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.rotateRegistrationCode,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: REGISTRATION_CODE_QUERY_KEY })
    },
  })
}
