import type { Account } from '@/features/accounts/types/account.types'
import type { AccountLevelConfig } from '@/shared/types'

export function applyChartVisibility(tree: Account[], config: AccountLevelConfig[]): Account[] {
  if (config.length === 0) return tree

  const visibilityById = new Map<number, boolean>(
    config.map((item) => [item.account_id, item.visible])
  )

  function filterNode(node: Account): Account | null {
    if (node.depth <= 2) {
      const visible = visibilityById.get(node.id)
      if (visible === false) return null
    }

    const children = node.children?.map(filterNode).filter((n): n is Account => n !== null) ?? []

    return {
      ...node,
      children,
    }
  }

  return tree.map(filterNode).filter((node): node is Account => node !== null)
}
