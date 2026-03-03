import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  authenticate,
  getRequestUser,
  refreshAccessToken,
  registerStudent,
} from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL

export const authHandlers = [
  http.post(`${BASE}/auth/register/`, async ({ request }) => {
    await delay(160)

    const body = (await request.json()) as {
      username?: string
      password?: string
      password_confirm?: string
      email?: string
      first_name?: string
      last_name?: string
      registration_code?: string
    }

    const result = registerStudent({
      username: body.username ?? '',
      password: body.password ?? '',
      password_confirm: body.password_confirm ?? '',
      email: body.email,
      first_name: body.first_name,
      last_name: body.last_name,
      registration_code: body.registration_code ?? '',
    })

    if (result.status === 400) {
      return HttpResponse.json(result.errors, { status: 400 })
    }
    if (result.status === 429) {
      return HttpResponse.json(
        { detail: 'Too many attempts', retry_after: result.retry_after },
        { status: 429 }
      )
    }

    return HttpResponse.json(result.user, { status: 201 })
  }),

  http.post(`${BASE}/auth/token/`, async ({ request }) => {
    await delay(120)

    const body = (await request.json()) as { username?: string; password?: string }
    if (!body.username || !body.password) {
      return HttpResponse.json({ detail: 'Missing credentials' }, { status: 400 })
    }

    const tokens = authenticate(body.username, body.password)
    if (!tokens) {
      return HttpResponse.json(
        { detail: 'No active account found with the given credentials' },
        { status: 401 }
      )
    }

    return HttpResponse.json(tokens)
  }),

  http.post(`${BASE}/auth/token/refresh/`, async ({ request }) => {
    await delay(90)

    const body = (await request.json()) as { refresh?: string }
    if (!body.refresh) {
      return HttpResponse.json({ detail: 'Refresh token required' }, { status: 400 })
    }

    const tokens = refreshAccessToken(body.refresh)
    if (!tokens) {
      return HttpResponse.json({ detail: 'Token is invalid or expired' }, { status: 401 })
    }

    return HttpResponse.json(tokens)
  }),

  http.get(`${BASE}/auth/me/`, async ({ request }) => {
    await delay(90)

    const user = getRequestUser(request)
    if (!user) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json(user)
  }),
]
