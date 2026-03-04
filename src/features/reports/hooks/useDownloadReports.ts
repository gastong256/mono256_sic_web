import { useMutation } from '@tanstack/react-query'
import { reportsApi } from '@/features/reports/api/reports.api'
import type {
  JournalBookReportParams,
  LedgerReportParams,
  TrialBalanceReportParams,
} from '@/features/reports/types/reports.types'

export function useDownloadJournalBookReport() {
  return useMutation({
    mutationFn: ({ companyId, params }: { companyId: number; params: JournalBookReportParams }) =>
      reportsApi.downloadJournalBookXlsx(companyId, params),
  })
}

export function useDownloadLedgerReport() {
  return useMutation({
    mutationFn: ({ companyId, params }: { companyId: number; params: LedgerReportParams }) =>
      reportsApi.downloadLedgerXlsx(companyId, params),
  })
}

export function useDownloadTrialBalanceReport() {
  return useMutation({
    mutationFn: ({ companyId, params }: { companyId: number; params: TrialBalanceReportParams }) =>
      reportsApi.downloadTrialBalanceXlsx(companyId, params),
  })
}
