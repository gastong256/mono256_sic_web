import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/features/reports/api/reports.api'
import type { TrialBalanceReportParams } from '@/features/reports/types/reports.types'

export const trialBalanceReportQueryKey = (
  companyId: number | null,
  params: TrialBalanceReportParams
) =>
  ['reports', 'trial-balance', companyId, params.dateFrom ?? null, params.dateTo ?? null] as const

export function useTrialBalanceReport(companyId: number | null, params: TrialBalanceReportParams) {
  return useQuery({
    queryKey: trialBalanceReportQueryKey(companyId, params),
    queryFn: () => reportsApi.trialBalance(companyId!, params),
    enabled: companyId !== null && companyId > 0,
  })
}
