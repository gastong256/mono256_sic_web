import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/features/admin/api/admin.api'
import type { AdminRoleUpdatePayload } from '@/shared/types'

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const

export function useAdminUsers() {
  return useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: adminApi.listUsers,
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: AdminRoleUpdatePayload }) =>
      adminApi.updateUserRole(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}
