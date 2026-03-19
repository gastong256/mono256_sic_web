import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/features/auth/api/auth.api'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { authQueryKeys } from '@/features/auth/hooks/authQueryKeys'
import type { UpdateMePayload } from '@/features/auth/api/auth.api'

export function useUpdateMe() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((state) => state.setUser)

  return useMutation({
    mutationFn: (payload: UpdateMePayload) => authApi.updateMe(payload),
    onSuccess: async (user) => {
      setUser(user)
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.root })
    },
  })
}
