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
        httpClient.patch(`/accounts/visibility/${item.account_id}/`, {
          is_visible: item.visible,
        })
      )
    ).then(() => accountChartApi.getConfig()),
}
