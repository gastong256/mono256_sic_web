import type {
  JournalBookReportParams,
  LedgerReportParams,
  TrialBalanceReportParams,
} from '@/features/reports/types/reports.types'

export const reportQueryKeys = {
  root: ['reports'] as const,
  company: (companyId: number) => ['reports', companyId] as const,
  journalBook: (companyId: number | null, params: JournalBookReportParams) =>
    ['reports', companyId, 'journal-book', params.dateFrom ?? null, params.dateTo ?? null] as const,
  ledger: (companyId: number | null, params: LedgerReportParams) =>
    [
      'reports',
      companyId,
      'ledger',
      params.dateFrom ?? null,
      params.dateTo ?? null,
      params.accountId ?? null,
    ] as const,
  trialBalance: (companyId: number | null, params: TrialBalanceReportParams) =>
    [
      'reports',
      companyId,
      'trial-balance',
      params.dateFrom ?? null,
      params.dateTo ?? null,
    ] as const,
}
