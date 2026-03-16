import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { ME_QUERY_KEY } from '@/features/auth/hooks/useMe'

export function useRotateRegistrationCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.rotateRegistrationCode,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
    },
  })
}
