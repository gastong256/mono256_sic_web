import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { accountChartApi } from '@/features/settings/api/accountChart.api'
import { isMovementAccount } from '@/features/accounts/lib/accountTree'
import type { Account } from '@/features/accounts/types/account.types'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'
import { applyChartVisibility } from '@/shared/lib/accountTreeVisibility'

export function collectMovementAccounts(accounts: Account[]): Account[] {
  return accounts.flatMap((account) => {
    const children = account.children ?? []
    const nestedAccounts = collectMovementAccounts(children)

    if (isMovementAccount(account)) {
      return [account]
    }

    return nestedAccounts
  })
}

export function useJournalAccounts(companyId: number) {
  return useQuery({
    queryKey: accountQueryKeys.companyFlat(companyId),
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
