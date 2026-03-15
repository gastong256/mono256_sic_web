import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'

export function useCompanyAccounts(companyId: number) {
  return useQuery({
    queryKey: accountQueryKeys.company(companyId),
    queryFn: () => accountsApi.getCompanyAccounts(companyId),
    enabled: companyId > 0,
  })
}
