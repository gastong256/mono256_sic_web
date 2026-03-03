import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/features/reports/api/reports.api'
import type { LedgerReportParams } from '@/features/reports/types/reports.types'

export const ledgerReportQueryKey = (companyId: number | null, params: LedgerReportParams) =>
  [
    'reports',
    'ledger',
    companyId,
    params.dateFrom ?? null,
    params.dateTo ?? null,
    params.accountId ?? null,
  ] as const

export function useLedgerReport(companyId: number | null, params: LedgerReportParams) {
  return useQuery({
    queryKey: ledgerReportQueryKey(companyId, params),
    queryFn: () => reportsApi.ledger(companyId!, params),
    enabled: companyId !== null && companyId > 0,
  })
}
