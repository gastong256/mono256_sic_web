import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/features/reports/api/reports.api'
import { reportQueryKeys } from '@/features/reports/hooks/reportQueryKeys'
import type { TrialBalanceReportParams } from '@/features/reports/types/reports.types'

export const trialBalanceReportQueryKey = reportQueryKeys.trialBalance

export function useTrialBalanceReport(
  companyId: number | null,
  params: TrialBalanceReportParams,
  options?: { enabled?: boolean; staleTime?: number; gcTime?: number }
) {
  return useQuery({
    queryKey: trialBalanceReportQueryKey(companyId, params),
    queryFn: () => reportsApi.trialBalance(companyId!, params),
    enabled: (options?.enabled ?? true) && companyId !== null && companyId > 0,
    staleTime: options?.staleTime ?? 60 * 1000,
    gcTime: options?.gcTime ?? 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
