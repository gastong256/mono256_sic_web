import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/features/reports/api/reports.api'
import { reportQueryKeys } from '@/features/reports/hooks/reportQueryKeys'
import type { JournalBookReportParams } from '@/features/reports/types/reports.types'

export const journalBookReportQueryKey = reportQueryKeys.journalBook

export function useJournalBookReport(
  companyId: number | null,
  params: JournalBookReportParams,
  options?: { enabled?: boolean; staleTime?: number; gcTime?: number }
) {
  return useQuery({
    queryKey: journalBookReportQueryKey(companyId, params),
    queryFn: () => reportsApi.journalBook(companyId!, params),
    enabled: (options?.enabled ?? true) && companyId !== null && companyId > 0,
    staleTime: options?.staleTime ?? 60 * 1000,
    gcTime: options?.gcTime ?? 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}
