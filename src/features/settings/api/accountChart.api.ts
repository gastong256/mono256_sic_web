import { httpClient } from '@/shared/lib/http'
import type { AccountLevelConfig } from '@/shared/types'

type VisibilityNode = {
  id?: number
  account_id?: number
  code?: string
  name?: string
  level?: number
  depth?: number
  is_visible?: boolean
  visible?: boolean
  children?: VisibilityNode[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function flattenByTreeDepth(nodes: VisibilityNode[]): AccountLevelConfig[] {
  const acc: AccountLevelConfig[] = []
  const seen = new Set<number>()

  function visit(node: VisibilityNode, depth: number) {
    const rawId = node.account_id ?? node.id
    const accountId = Number(rawId)

    if (
      (depth === 1 || depth === 2) &&
      Number.isFinite(accountId) &&
      accountId > 0 &&
      node.code &&
      node.name &&
      !seen.has(accountId)
    ) {
      seen.add(accountId)
      acc.push({
        account_id: accountId,
        level: depth === 1 ? 0 : 1,
        code: node.code,
        name: node.name,
        visible: node.is_visible ?? node.visible ?? true,
      })
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      node.children.forEach((child) => visit(child, depth + 1))
    }
  }

  nodes.forEach((node) => visit(node, 1))
  return acc
}

function flattenByDeclaredLevel(nodes: VisibilityNode[]): AccountLevelConfig[] {
  const declaredLevels = nodes
    .map((node) => Number(node.level ?? node.depth))
    .filter((level) => Number.isFinite(level))

  if (declaredLevels.length === 0) return []

  const acc: AccountLevelConfig[] = []
  const seen = new Set<number>()

  nodes.forEach((node) => {
    const normalizedLevel = Number(node.level ?? node.depth)
    const accountId = Number(node.account_id ?? node.id)
    if (
      (normalizedLevel === 0 || normalizedLevel === 1) &&
      Number.isFinite(accountId) &&
      accountId > 0 &&
      node.code &&
      node.name &&
      !seen.has(accountId)
    ) {
      seen.add(accountId)
      acc.push({
        account_id: accountId,
        level: normalizedLevel,
        code: node.code,
        name: node.name,
        visible: node.is_visible ?? node.visible ?? true,
      })
    }
  })

  return acc
}

function flattenVisibilityPayload(nodes: VisibilityNode[]): AccountLevelConfig[] {
  const byDepth = flattenByTreeDepth(nodes)

  // If payload arrives flat (no nested children), use declared level/depth as fallback.
  if (byDepth.length > 0 && byDepth.some((item) => item.level === 1)) {
    return byDepth
  }

  const byLevel = flattenByDeclaredLevel(nodes)
  return byLevel.length > 0 ? byLevel : byDepth
}

export const accountChartApi = {
  getConfig: (params?: { teacherId?: number }): Promise<AccountLevelConfig[]> =>
    httpClient
      .get<VisibilityNode[] | { results: VisibilityNode[] } | { data: VisibilityNode[] }>(
        '/accounts/visibility/',
        {
          params:
            params?.teacherId && params.teacherId > 0
              ? { teacher_id: params.teacherId }
              : undefined,
        }
      )
      .then((r) => {
        const payload = r.data
        const nodes = Array.isArray(payload)
          ? payload
          : 'results' in payload
            ? payload.results
            : payload.data
        return flattenVisibilityPayload(nodes ?? [])
      }),

  updateConfig: (
    payload: AccountLevelConfig[],
    params?: { teacherId?: number }
  ): Promise<AccountLevelConfig[]> =>
    (() => {
      const uniqueUpdates = Array.from(
        payload.reduce((acc, item) => {
          acc.set(item.account_id, {
            account_id: item.account_id,
            is_visible: item.visible,
          })
          return acc
        }, new Map<number, { account_id: number; is_visible: boolean }>())
      ).map(([, value]) => value)

      return httpClient
        .patch<unknown>('/accounts/visibility/batch/', {
          ...(params?.teacherId && params.teacherId > 0 ? { teacher_id: params.teacherId } : null),
          updates: uniqueUpdates,
        })
        .then((r) => r.data)
        .then((latest) => {
          if (Array.isArray(latest)) {
            return flattenVisibilityPayload(latest as VisibilityNode[])
          }
          if (isRecord(latest) && Array.isArray(latest.results)) {
            return flattenVisibilityPayload(latest.results as VisibilityNode[])
          }
          if (isRecord(latest) && Array.isArray(latest.data)) {
            return flattenVisibilityPayload(latest.data as VisibilityNode[])
          }
          return accountChartApi.getConfig({ teacherId: params?.teacherId })
        })
    })(),
}
