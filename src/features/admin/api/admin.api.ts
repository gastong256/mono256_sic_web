import { httpClient } from '@/shared/lib/http'
import type { AdminRoleUpdatePayload, User } from '@/shared/types'
import { extractListPayload, extractPaginationMeta } from '@/shared/lib/apiPagination'

export type AdminListUsersParams = {
  page?: number
  role?: 'admin' | 'teacher' | 'student'
  search?: string
}

export interface AdminUsersPage {
  results: User[]
  count: number | null
  next: string | null
  previous: string | null
}

export const adminApi = {
  listUsers: (params?: AdminListUsersParams): Promise<AdminUsersPage> =>
    httpClient.get<unknown>('/admin/users/', { params }).then((r) => {
      const payload = r.data
      const results = extractListPayload<User>(payload)
      const meta = extractPaginationMeta(payload, results.length)

      return {
        results,
        count: meta.count,
        next: meta.next,
        previous: meta.previous,
      }
    }),

  updateUserRole: (userId: number, payload: AdminRoleUpdatePayload): Promise<User> =>
    httpClient.patch<User>(`/admin/users/${userId}/role/`, payload).then((r) => r.data),
}
