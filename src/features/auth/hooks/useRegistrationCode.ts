import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { authQueryKeys } from '@/features/auth/hooks/authQueryKeys'

export function useRotateRegistrationCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.rotateRegistrationCode,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.root })
    },
  })
}
