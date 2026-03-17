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
const PAGE_SIZE = 25

function isAllParam(value: string | null): boolean {
  if (!value) return false
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
}

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
    const all = isAllParam(url.searchParams.get('all'))
    const summary = url.searchParams.get('summary')
    const role = url.searchParams.get('role')
    const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
    const pageRaw = url.searchParams.get('page')
    const page = pageRaw ? Number(pageRaw) : 1

    let users = listUsers()

    if (role === 'admin' || role === 'teacher' || role === 'student') {
      users = users.filter((candidate) => candidate.role === role)
    }

    if (search.length > 0) {
      users = users.filter((candidate) =>
        [
          candidate.username,
          candidate.email,
          candidate.first_name,
          candidate.last_name,
          `${candidate.first_name} ${candidate.last_name}`.trim(),
        ].some((value) => value.toLowerCase().includes(search))
      )
    }

    const results = users.map((candidate) =>
      summary === 'selector'
        ? {
            id: candidate.id,
            username: candidate.username,
            first_name: candidate.first_name,
            last_name: candidate.last_name,
            full_name: `${candidate.first_name} ${candidate.last_name}`.trim(),
            role: candidate.role,
          }
        : candidate
    )

    if (all) {
      return HttpResponse.json({
        count: results.length,
        next: null,
        previous: null,
        results,
      })
    }

    const start = Math.max(0, (Number.isFinite(page) ? page : 1) - 1) * PAGE_SIZE
    const normalizedPage = Math.max(1, Number.isFinite(page) ? page : 1)
    const end = start + PAGE_SIZE

    const next = end < results.length ? `${BASE}/admin/users/?page=${normalizedPage + 1}` : null
    const previous = normalizedPage > 1 ? `${BASE}/admin/users/?page=${normalizedPage - 1}` : null

    return HttpResponse.json({
      count: results.length,
      next,
      previous,
      results: results.slice(start, end),
    })
  }),

  http.patch(`${BASE}/admin/users/:userId/role/`, async ({ request, params }) => {
    await delay(140)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    const body = (await request.json()) as { role?: Role }
    if (
      !body.role ||
      (body.role !== 'teacher' && body.role !== 'student' && body.role !== 'admin')
    ) {
      return HttpResponse.json({ role: ['Role inválido.'] }, { status: 400 })
    }

    const updated = updateUserRole(Number(params.userId), body.role)
    if (!updated)
      return HttpResponse.json({ detail: 'No se pudo actualizar el rol.' }, { status: 400 })

    return HttpResponse.json(updated)
  }),
]
