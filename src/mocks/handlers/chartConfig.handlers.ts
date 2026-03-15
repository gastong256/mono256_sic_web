import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import { getAccountChartConfig, getRequestUser, listUsers } from '@/mocks/data/mockDb'
import type { AccountLevelConfig, User } from '@/shared/types'

const BASE = env.VITE_API_BASE_URL

type VisibilityNode = {
  account_id: number
  code: string
  name: string
  level: 0 | 1
  is_visible: boolean
  children: VisibilityNode[]
}

const visibilityConfigByScope = new Map<string, AccountLevelConfig[]>()

function cloneConfig(items: AccountLevelConfig[]): AccountLevelConfig[] {
  return items.map((item) => ({ ...item }))
}

function getScopeConfig(scopeKey: string): AccountLevelConfig[] {
  const current = visibilityConfigByScope.get(scopeKey)
  if (current) return cloneConfig(current)

  const seed = cloneConfig(getAccountChartConfig())
  visibilityConfigByScope.set(scopeKey, seed)
  return cloneConfig(seed)
}

function setScopeConfig(scopeKey: string, config: AccountLevelConfig[]): AccountLevelConfig[] {
  const next = cloneConfig(config)
  visibilityConfigByScope.set(scopeKey, next)
  return cloneConfig(next)
}

function resolveScope(
  user: User,
  teacherIdRaw: unknown
): { scopeKey: string; response: null } | { scopeKey: null; response: Response } {
  if (user.role === 'admin') {
    const teacherId = Number(teacherIdRaw)
    if (!Number.isFinite(teacherId) || teacherId <= 0) {
      return {
        scopeKey: null,
        response: HttpResponse.json(
          {
            error: {
              code: 'validation_error',
              message: 'Invalid input.',
              detail: {
                teacher_id: 'teacher_id is required for admin requests.',
              },
            },
          },
          { status: 400 }
        ),
      }
    }

    const teacher = listUsers().find((candidate) => candidate.id === teacherId)
    if (!teacher || teacher.role !== 'teacher') {
      return {
        scopeKey: null,
        response: HttpResponse.json(
          {
            error: {
              code: 'validation_error',
              message: 'Invalid input.',
              detail: {
                teacher_id: 'teacher_id must reference a teacher user.',
              },
            },
          },
          { status: 400 }
        ),
      }
    }

    return { scopeKey: `teacher:${teacherId}`, response: null }
  }

  if (user.role === 'teacher') {
    return { scopeKey: `teacher:${user.id}`, response: null }
  }

  return {
    scopeKey: null,
    response: HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }),
  }
}

function buildVisibilityTree(items: AccountLevelConfig[]): VisibilityNode[] {
  const level0 = items.filter((item) => item.level === 0)
  const level1 = items.filter((item) => item.level === 1)

  return level0.map((parent) => ({
    account_id: parent.account_id,
    code: parent.code,
    name: parent.name,
    level: 0,
    is_visible: parent.visible,
    children: level1
      .filter((child) => child.code.startsWith(`${parent.code}.`))
      .map((child) => ({
        account_id: child.account_id,
        code: child.code,
        name: child.name,
        level: 1,
        is_visible: child.visible,
        children: [],
      })),
  }))
}

function applySingleUpdate(
  config: AccountLevelConfig[],
  accountId: number,
  isVisible: boolean
): AccountLevelConfig[] | null {
  const idx = config.findIndex((item) => item.account_id === accountId)
  if (idx === -1) return null

  const next = cloneConfig(config)
  next[idx] = { ...next[idx], visible: isVisible }
  return next
}

type BatchUpdate = {
  account_id: number
  is_visible: boolean
}

function applyBatchUpdates(
  config: AccountLevelConfig[],
  updates: BatchUpdate[]
): AccountLevelConfig[] | null {
  const next = cloneConfig(config)
  const seen = new Set<number>()

  for (const update of updates) {
    if (seen.has(update.account_id)) return null
    seen.add(update.account_id)
    const idx = next.findIndex((item) => item.account_id === update.account_id)
    if (idx === -1) return null
    next[idx] = { ...next[idx], visible: update.is_visible }
  }

  return next
}

export const chartConfigHandlers = [
  http.get(`${BASE}/accounts/visibility/`, async ({ request }) => {
    await delay(80)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    const url = new URL(request.url)
    const scope = resolveScope(user, url.searchParams.get('teacher_id'))
    if (scope.response) return scope.response

    return HttpResponse.json(buildVisibilityTree(getScopeConfig(scope.scopeKey)))
  }),

  http.get(`${BASE}/accounts/visibility/:accountId/`, async ({ request }) => {
    await delay(80)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    const url = new URL(request.url)
    const scope = resolveScope(user, url.searchParams.get('teacher_id'))
    if (scope.response) return scope.response

    return HttpResponse.json(buildVisibilityTree(getScopeConfig(scope.scopeKey)))
  }),

  http.patch(`${BASE}/accounts/visibility/:accountId/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { is_visible?: boolean; teacher_id?: number }
    const scope = resolveScope(user, body.teacher_id)
    if (scope.response) return scope.response

    if (typeof body.is_visible !== 'boolean') {
      return HttpResponse.json({ is_visible: ['Formato inválido.'] }, { status: 400 })
    }

    const currentConfig = getScopeConfig(scope.scopeKey)
    const updated = applySingleUpdate(currentConfig, Number(params.accountId), body.is_visible)
    if (!updated) return HttpResponse.json({ detail: 'Account not found.' }, { status: 404 })

    return HttpResponse.json(buildVisibilityTree(setScopeConfig(scope.scopeKey, updated)))
  }),

  http.patch(`${BASE}/accounts/visibility/batch/`, async ({ request }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as {
      teacher_id?: number
      updates?: BatchUpdate[]
    }
    const scope = resolveScope(user, body.teacher_id)
    if (scope.response) return scope.response

    if (!Array.isArray(body.updates) || body.updates.length === 0) {
      return HttpResponse.json(
        { updates: ['Debe enviar al menos una actualización.'] },
        { status: 400 }
      )
    }

    const hasInvalidUpdate = body.updates.some(
      (update) =>
        typeof update !== 'object' ||
        update === null ||
        !Number.isFinite(Number((update as { account_id?: unknown }).account_id)) ||
        typeof (update as { is_visible?: unknown }).is_visible !== 'boolean'
    )
    if (hasInvalidUpdate) {
      return HttpResponse.json({ updates: ['Formato inválido en updates.'] }, { status: 400 })
    }

    const sanitized = body.updates.map((update) => ({
      account_id: Number(update.account_id),
      is_visible: update.is_visible,
    }))
    if (sanitized.some((update) => !Number.isFinite(update.account_id) || update.account_id <= 0)) {
      return HttpResponse.json({ updates: ['account_id inválido en updates.'] }, { status: 400 })
    }

    const currentConfig = getScopeConfig(scope.scopeKey)
    const updated = applyBatchUpdates(currentConfig, sanitized)
    if (!updated) {
      return HttpResponse.json(
        { updates: ['updates requiere ids únicos y cuentas existentes.'] },
        { status: 400 }
      )
    }

    return HttpResponse.json(buildVisibilityTree(setScopeConfig(scope.scopeKey, updated)))
  }),
]
