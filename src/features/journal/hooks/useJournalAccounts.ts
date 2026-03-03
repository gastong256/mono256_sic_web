import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import type { Account } from '@/features/accounts/types/account.types'

function flattenLeaves(accounts: Account[]): Account[] {
  return accounts.flatMap((a) => (a.children?.length ? flattenLeaves(a.children) : [a]))
}

export function useJournalAccounts(companyId: number) {
  return useQuery({
    queryKey: ['accounts', 'company', companyId, 'flat'] as const,
    queryFn: async () => {
      const tree = await accountsApi.getCompanyAccounts(companyId)
      return flattenLeaves(tree)
    },
    enabled: companyId > 0,
  })
}
