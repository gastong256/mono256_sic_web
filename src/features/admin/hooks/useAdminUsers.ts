import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/features/admin/api/admin.api'
import { authQueryKeys } from '@/features/auth/hooks/authQueryKeys'
import type { AdminRoleUpdatePayload } from '@/shared/types'
import type { AdminListUsersParams, AdminUsersPage } from '@/features/admin/api/admin.api'

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const
export const ADMIN_TEACHERS_QUERY_KEY = ['admin', 'teachers'] as const

export function useAdminUsers(params?: AdminListUsersParams) {
  return useQuery<AdminUsersPage>({
    queryKey: [...ADMIN_USERS_QUERY_KEY, params ?? {}] as const,
    queryFn: () => adminApi.listUsers(params),
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: AdminRoleUpdatePayload }) =>
      adminApi.updateUserRole(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.root })
    },
  })
}

export function useAdminTeachers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ADMIN_TEACHERS_QUERY_KEY,
    queryFn: adminApi.listTeachers,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
