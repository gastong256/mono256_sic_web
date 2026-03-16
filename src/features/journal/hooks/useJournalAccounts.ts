import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { isMovementAccount } from '@/features/accounts/lib/accountTree'
import type { Account } from '@/features/accounts/types/account.types'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'

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
    queryFn: () =>
      accountsApi.getCompanyAccounts(companyId).then((tree) => collectMovementAccounts(tree)),
    enabled: companyId > 0,
  })
}
