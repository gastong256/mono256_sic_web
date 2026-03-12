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

function flattenVisibilityTree(nodes: VisibilityNode[], acc: AccountLevelConfig[] = []) {
  nodes.forEach((node) => {
    const level = node.level ?? node.depth
    const accountId = node.account_id ?? node.id
    if ((level === 1 || level === 2) && accountId && node.code && node.name) {
      acc.push({
        account_id: accountId,
        level,
        code: node.code,
        name: node.name,
        visible: node.is_visible ?? node.visible ?? true,
      })
    }
    if (node.children?.length) flattenVisibilityTree(node.children, acc)
  })

  return acc
}

export const accountChartApi = {
  getConfig: (): Promise<AccountLevelConfig[]> =>
    httpClient
      .get<VisibilityNode[] | { results: VisibilityNode[] }>('/accounts/visibility/')
      .then((r) => {
        const payload = r.data
        const nodes = Array.isArray(payload) ? payload : payload.results
        return flattenVisibilityTree(nodes ?? [])
      }),

  updateConfig: (payload: AccountLevelConfig[]): Promise<AccountLevelConfig[]> =>
    Promise.all(
      payload.map((item) =>
        httpClient
          .patch<unknown>(`/accounts/visibility/${item.account_id}/`, {
            is_visible: item.visible,
          })
          .then((r) => r.data)
      )
    ).then((responses) => {
      const latest = responses[responses.length - 1]
      if (Array.isArray(latest)) {
        return flattenVisibilityTree(latest as VisibilityNode[])
      }
      if (isRecord(latest) && Array.isArray(latest.results)) {
        return flattenVisibilityTree(latest.results as VisibilityNode[])
      }
      return accountChartApi.getConfig()
    }),
}
