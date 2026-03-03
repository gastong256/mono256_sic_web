import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import { getRequestUser, listUsers, updateUserRole } from '@/mocks/data/mockDb'
import type { Role } from '@/shared/types'

const BASE = env.VITE_API_BASE_URL

export const adminHandlers = [
  http.get(`${BASE}/admin/users/`, async ({ request }) => {
    await delay(100)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    return HttpResponse.json(listUsers())
  }),

  http.patch(`${BASE}/admin/users/:userId/role/`, async ({ request, params }) => {
    await delay(140)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    const body = (await request.json()) as { role?: Role }
    if (!body.role || (body.role !== 'teacher' && body.role !== 'student')) {
      return HttpResponse.json({ role: ['Role inválido.'] }, { status: 400 })
    }

    const updated = updateUserRole(Number(params.userId), body.role)
    if (!updated)
      return HttpResponse.json({ detail: 'No se pudo actualizar el rol.' }, { status: 400 })

    return HttpResponse.json(updated)
  }),
]
