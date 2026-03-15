import { httpClient } from '@/shared/lib/http'
import { extractListPayload } from '@/shared/lib/apiPagination'
import { isRecord, toNumberValue, toStringValue } from '@/shared/lib/valueParsers'
import type { AccountLevelConfig } from '@/shared/types'

type VisibilityNodePayload = {
  id?: number
  account_id?: number
  code?: string
  name?: string
  level?: number
  is_visible?: boolean
  visible?: boolean
  children?: VisibilityNodePayload[]
}

function normalizeVisibilityNode(
  raw: unknown,
  inferredLevel?: 0 | 1
): (AccountLevelConfig & { children: VisibilityNodePayload[] }) | null {
  if (!isRecord(raw)) return null

  const accountId = toNumberValue(raw.account_id ?? raw.id)
  const declaredLevel = toNumberValue(raw.level, Number.NaN)
  const level = declaredLevel === 0 || declaredLevel === 1 ? declaredLevel : inferredLevel

  if (accountId <= 0 || level === undefined) return null

  const code = toStringValue(raw.code)
  const name = toStringValue(raw.name)
  if (code.length === 0 || name.length === 0) return null

  return {
    account_id: accountId,
    level,
    code,
    name,
    visible:
      typeof raw.is_visible === 'boolean'
        ? raw.is_visible
        : typeof raw.visible === 'boolean'
          ? raw.visible
          : true,
    children: Array.isArray(raw.children) ? (raw.children as VisibilityNodePayload[]) : [],
  }
}

function flattenVisibilityPayload(payload: unknown): AccountLevelConfig[] {
  const roots = extractListPayload<unknown>(payload)
  const items: AccountLevelConfig[] = []
  const seen = new Set<number>()

  function visit(node: unknown, inferredLevel?: 0 | 1) {
    const normalized = normalizeVisibilityNode(node, inferredLevel)
    if (!normalized || seen.has(normalized.account_id)) return

    seen.add(normalized.account_id)
    items.push({
      account_id: normalized.account_id,
      level: normalized.level,
      code: normalized.code,
      name: normalized.name,
      visible: normalized.visible,
    })

    const childLevel = normalized.level === 0 ? 1 : undefined
    normalized.children.forEach((child) => visit(child, childLevel))
  }

  roots.forEach((node) => visit(node))
  return items
}

function buildVisibilityUpdates(payload: AccountLevelConfig[]) {
  return Array.from(
    payload.reduce((acc, item) => {
      acc.set(item.account_id, {
        account_id: item.account_id,
        is_visible: item.visible,
      })
      return acc
    }, new Map<number, { account_id: number; is_visible: boolean }>())
  ).map(([, value]) => value)
}

export const accountChartApi = {
  getConfig: (params?: { teacherId?: number }): Promise<AccountLevelConfig[]> =>
    httpClient
      .get<unknown>('/accounts/visibility/', {
        params:
          params?.teacherId && params.teacherId > 0 ? { teacher_id: params.teacherId } : undefined,
      })
      .then((response) => flattenVisibilityPayload(response.data)),

  updateConfig: (
    payload: AccountLevelConfig[],
    params?: { teacherId?: number }
  ): Promise<AccountLevelConfig[]> =>
    httpClient
      .patch<unknown>('/accounts/visibility/batch/', {
        ...(params?.teacherId && params.teacherId > 0 ? { teacher_id: params.teacherId } : null),
        updates: buildVisibilityUpdates(payload),
      })
      .then((response) => flattenVisibilityPayload(response.data)),
}
