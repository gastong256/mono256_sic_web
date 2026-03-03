import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  getRegistrationCode,
  getRequestUser,
  listUsers,
  rotateRegistrationCode,
  updateUserRole,
} from '@/mocks/data/mockDb'
import type { Role } from '@/shared/types'

const BASE = env.VITE_API_BASE_URL

export const adminHandlers = [
  http.get(`${BASE}/admin/registration-code/`, async ({ request }) => {
    await delay(100)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    return HttpResponse.json(getRegistrationCode())
  }),

  http.post(`${BASE}/admin/registration-code/rotate/`, async ({ request }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    return HttpResponse.json(rotateRegistrationCode())
  }),

  http.get(`${BASE}/admin/users/`, async ({ request }) => {
    await delay(100)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    const url = new URL(request.url)
    const role = url.searchParams.get('role')
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
    const pageRaw = url.searchParams.get('page')
    const page = pageRaw ? Number(pageRaw) : 1

    let users = listUsers()

    if (role === 'admin' || role === 'teacher' || role === 'student') {
      users = users.filter((candidate) => candidate.role === role)
    }

    if (search.length > 0) {
      users = users.filter((candidate) => candidate.username.toLowerCase().includes(search))
    }

    // Keep response shape as array (per OpenAPI), with lightweight page slicing for mocks.
    const PAGE_SIZE = 20
    const start = Math.max(0, (Number.isFinite(page) ? page : 1) - 1) * PAGE_SIZE
    return HttpResponse.json(users.slice(start, start + PAGE_SIZE))
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
