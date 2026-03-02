import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'

const BASE = env.VITE_API_BASE_URL

const MOCK_USER = {
  id: 'usr_01',
  email: 'user@example.com',
  name: 'Demo User',
}

// Track the current valid refresh token in memory (reset between test runs via server.resetHandlers)
let currentRefreshToken = 'mock-refresh-token'
let currentAccessToken = 'mock-access-token'

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  return auth !== null && auth.startsWith('Bearer ')
}

export const authHandlers = [
  // POST /auth/login
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(150) // Simulate network latency

    const body = (await request.json()) as { email?: string; password?: string }

    if (body.email === 'user@example.com' && body.password === 'password') {
      currentAccessToken = 'mock-access-token'
      currentRefreshToken = 'mock-refresh-token'

      return HttpResponse.json({
        access_token: currentAccessToken,
        refresh_token: currentRefreshToken,
        user: MOCK_USER,
      })
    }

    return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 })
  }),

  // POST /auth/refresh
  http.post(`${BASE}/auth/refresh`, async ({ request }) => {
    await delay(100)

    const body = (await request.json()) as { refresh_token?: string }

    if (body.refresh_token && body.refresh_token === currentRefreshToken) {
      currentAccessToken = `mock-access-token-${Date.now()}`
      currentRefreshToken = `mock-refresh-token-${Date.now()}`

      return HttpResponse.json({
        access_token: currentAccessToken,
        refresh_token: currentRefreshToken,
      })
    }

    return HttpResponse.json({ message: 'Invalid or expired refresh token' }, { status: 401 })
  }),

  // GET /me
  http.get(`${BASE}/me`, async ({ request }) => {
    await delay(100)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json({ user: MOCK_USER })
  }),
]
