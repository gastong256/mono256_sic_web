import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/features/accounts/api/accounts.api'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'

export function useAccountsChart(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: accountQueryKeys.chart(),
    queryFn: () => accountsApi.getChart(),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}
