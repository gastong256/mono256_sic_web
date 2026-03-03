import { httpClient } from '@/shared/lib/http'
import type { AdminRoleUpdatePayload, User } from '@/shared/types'

export const adminApi = {
  listUsers: (): Promise<User[]> => httpClient.get<User[]>('/admin/users/').then((r) => r.data),

  updateUserRole: (userId: number, payload: AdminRoleUpdatePayload): Promise<User> =>
    httpClient.patch<User>(`/admin/users/${userId}/role/`, payload).then((r) => r.data),
}
