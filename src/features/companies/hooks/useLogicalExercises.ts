import { useQuery } from '@tanstack/react-query'
import { companyClosingApi } from '@/features/companies/api/companyClosing.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'

export function useLogicalExercises(companyId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: companyQueryKeys.logicalExercises(companyId),
    queryFn: () => companyClosingApi.logicalExercises(companyId),
    enabled: (options?.enabled ?? true) && companyId > 0,
  })
}
