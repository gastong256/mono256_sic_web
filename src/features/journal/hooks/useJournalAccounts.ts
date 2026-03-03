import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { accountChartApi } from '@/features/settings/api/accountChart.api'
import type { Account } from '@/features/accounts/types/account.types'
import { applyChartVisibility } from '@/shared/lib/accountTreeVisibility'

function flattenLeaves(accounts: Account[]): Account[] {
  return accounts.flatMap((a) => (a.children?.length ? flattenLeaves(a.children) : [a]))
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
      return flattenLeaves(visibleTree)
    },
    enabled: companyId > 0,
  })
}
