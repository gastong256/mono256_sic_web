import { useQuery } from '@tanstack/react-query'
import { companyClosingApi } from '@/features/companies/api/companyClosing.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'

export function useCompanyClosingState(companyId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: companyQueryKeys.closingState(companyId),
    queryFn: () => companyClosingApi.state(companyId),
    enabled: (options?.enabled ?? true) && companyId > 0,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
