import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import { getAccountChartConfig, getRequestUser, patchAccountChartConfig } from '@/mocks/data/mockDb'
import type { AccountLevelConfig } from '@/shared/types'

const BASE = env.VITE_API_BASE_URL

export const chartConfigHandlers = [
  http.get(`${BASE}/account-chart/config/`, async ({ request }) => {
    await delay(80)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    return HttpResponse.json(getAccountChartConfig())
  }),

  http.patch(`${BASE}/account-chart/config/`, async ({ request }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as { items?: AccountLevelConfig[] }
    if (!body.items || !Array.isArray(body.items)) {
      return HttpResponse.json({ items: ['Formato inválido.'] }, { status: 400 })
    }

    return HttpResponse.json(patchAccountChartConfig(body.items))
  }),
]
