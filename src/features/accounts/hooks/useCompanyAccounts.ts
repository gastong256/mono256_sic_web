import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'

export const companyAccountsQueryKey = (companyId: number) =>
  ['accounts', 'company', companyId] as const

export function useCompanyAccounts(companyId: number) {
  return useQuery({
    queryKey: companyAccountsQueryKey(companyId),
    queryFn: () => accountsApi.getCompanyAccounts(companyId),
    enabled: companyId > 0,
  })
}
