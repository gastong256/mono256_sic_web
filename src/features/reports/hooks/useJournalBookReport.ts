import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/features/reports/api/reports.api'
import type { JournalBookReportParams } from '@/features/reports/types/reports.types'

export const journalBookReportQueryKey = (
  companyId: number | null,
  params: JournalBookReportParams
) => ['reports', 'journal-book', companyId, params.dateFrom ?? null, params.dateTo ?? null] as const

export function useJournalBookReport(companyId: number | null, params: JournalBookReportParams) {
  return useQuery({
    queryKey: journalBookReportQueryKey(companyId, params),
    queryFn: () => reportsApi.journalBook(companyId!, params),
    enabled: companyId !== null && companyId > 0,
  })
}
