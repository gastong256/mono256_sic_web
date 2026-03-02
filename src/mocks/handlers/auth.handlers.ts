import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'

const BASE = env.VITE_API_BASE_URL

const MOCK_USER = {
  id: 'usr_01',
  username: 'admin',
  email: 'admin@example.com',
  name: 'Admin',
  is_staff: false,
}

// Track the current valid refresh token in memory (reset between test runs via server.resetHandlers)
let currentRefreshToken = 'mock-refresh-token'

function makeMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `${header}.${body}.mock-signature`
}

function makeAccessToken(isStaff = false): string {
  return makeMockJwt({
    user_id: 1,
    username: MOCK_USER.username,
    is_staff: isStaff,
    exp: 9999999999,
  })
}

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  return auth !== null && auth.startsWith('Bearer ')
}

export const authHandlers = [
  // POST /auth/token/
  http.post(`${BASE}/auth/token/`, async ({ request }) => {
    await delay(150)

    const body = (await request.json()) as { username?: string; password?: string }

    if (body.username === 'admin' && body.password === 'password') {
      currentRefreshToken = 'mock-refresh-token'

      return HttpResponse.json({
        access: makeAccessToken(false),
        refresh: currentRefreshToken,
      })
    }

    return HttpResponse.json(
      { detail: 'No active account found with the given credentials' },
      { status: 401 }
    )
  }),

  // POST /auth/token/refresh/
  http.post(`${BASE}/auth/token/refresh/`, async ({ request }) => {
    await delay(100)

    const body = (await request.json()) as { refresh?: string }

    if (body.refresh && body.refresh === currentRefreshToken) {
      const newRefresh = `mock-refresh-${Date.now()}`
      currentRefreshToken = newRefresh

      return HttpResponse.json({
        access: makeAccessToken(false),
        refresh: newRefresh,
      })
    }

    return HttpResponse.json({ detail: 'Token is invalid or expired' }, { status: 401 })
  }),

  // GET /me
  http.get(`${BASE}/me`, async ({ request }) => {
    await delay(100)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json({ user: MOCK_USER })
  }),
]
