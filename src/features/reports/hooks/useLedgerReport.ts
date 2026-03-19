import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/features/reports/api/reports.api'
import { reportQueryKeys } from '@/features/reports/hooks/reportQueryKeys'
import type { LedgerReportParams } from '@/features/reports/types/reports.types'

export const ledgerReportQueryKey = reportQueryKeys.ledger

export function useLedgerReport(
  companyId: number | null,
  params: LedgerReportParams,
  options?: { enabled?: boolean; staleTime?: number; gcTime?: number }
) {
  return useQuery({
    queryKey: ledgerReportQueryKey(companyId, params),
    queryFn: () => reportsApi.ledger(companyId!, params),
    enabled: (options?.enabled ?? true) && companyId !== null && companyId > 0,
    staleTime: options?.staleTime ?? 60 * 1000,
    gcTime: options?.gcTime ?? 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
