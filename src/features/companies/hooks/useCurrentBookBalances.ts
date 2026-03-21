import { useQuery } from '@tanstack/react-query'
import { companyClosingApi } from '@/features/companies/api/companyClosing.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'

export function useCurrentBookBalances(
  companyId: number,
  dateTo?: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: companyQueryKeys.currentBalances(companyId, dateTo),
    queryFn: () => companyClosingApi.currentBalances(companyId, dateTo),
    enabled: (options?.enabled ?? true) && companyId > 0,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
