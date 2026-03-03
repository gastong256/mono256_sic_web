import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  getAccountChartConfig,
  getRequestUser,
  patchSingleAccountVisibility,
} from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL

type VisibilityNode = {
  account_id: number
  code: string
  name: string
  level: 1 | 2
  is_visible: boolean
  children: VisibilityNode[]
}

function buildVisibilityTree(): VisibilityNode[] {
  const items = getAccountChartConfig()
  const level1 = items.filter((item) => item.level === 1)
  const level2 = items.filter((item) => item.level === 2)

  return level1.map((parent) => ({
    account_id: parent.account_id,
    code: parent.code,
    name: parent.name,
    level: 1,
    is_visible: parent.visible,
    children: level2
      .filter((child) => child.code.startsWith(`${parent.code}.`))
      .map((child) => ({
        account_id: child.account_id,
        code: child.code,
        name: child.name,
        level: 2,
        is_visible: child.visible,
        children: [],
      })),
  }))
}

export const chartConfigHandlers = [
  http.get(`${BASE}/accounts/visibility/`, async ({ request }) => {
    await delay(80)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    return HttpResponse.json(buildVisibilityTree())
  }),

  http.get(`${BASE}/accounts/visibility/:accountId/`, async ({ request }) => {
    await delay(80)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    return HttpResponse.json(buildVisibilityTree())
  }),

  http.patch(`${BASE}/accounts/visibility/:accountId/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as { is_visible?: boolean }
    if (typeof body.is_visible !== 'boolean') {
      return HttpResponse.json({ is_visible: ['Formato inválido.'] }, { status: 400 })
    }

    const updated = patchSingleAccountVisibility(Number(params.accountId), body.is_visible)
    if (!updated) return HttpResponse.json({ detail: 'Account not found.' }, { status: 404 })

    return HttpResponse.json({
      account_id: updated.account_id,
      is_visible: updated.visible,
    })
  }),
]
