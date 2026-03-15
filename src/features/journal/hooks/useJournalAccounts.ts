import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { accountChartApi } from '@/features/settings/api/accountChart.api'
import type { Account } from '@/features/accounts/types/account.types'
import { applyChartVisibility } from '@/shared/lib/accountTreeVisibility'

export function collectMovementAccounts(accounts: Account[]): Account[] {
  return accounts.flatMap((account) => {
    const children = account.children ?? []
    const nestedAccounts = collectMovementAccounts(children)

    // Company-associated posting accounts live at the movement level.
    if (account.depth > 2 && children.length === 0) {
      return [account]
    }

    return nestedAccounts
  })
}

export function useJournalAccounts(companyId: number) {
  return useQuery({
    queryKey: ['accounts', 'company', companyId, 'flat'] as const,
    queryFn: async () => {
      const [tree, config] = await Promise.all([
        accountsApi.getCompanyAccounts(companyId),
        accountChartApi.getConfig(),
      ])
      const visibleTree = applyChartVisibility(tree, config)
      return collectMovementAccounts(visibleTree)
    },
    enabled: companyId > 0,
  })
}
