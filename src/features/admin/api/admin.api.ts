import { httpClient } from '@/shared/lib/http'
import type { AdminRoleUpdatePayload, User } from '@/shared/types'

export type AdminListUsersParams = {
  page?: number
  role?: 'admin' | 'teacher' | 'student'
  search?: string
}

export const adminApi = {
  listUsers: (params?: AdminListUsersParams): Promise<User[]> =>
    httpClient.get<User[]>('/admin/users/', { params }).then((r) => r.data),

  updateUserRole: (userId: number, payload: AdminRoleUpdatePayload): Promise<User> =>
    httpClient.patch<User>(`/admin/users/${userId}/role/`, payload).then((r) => r.data),
}
