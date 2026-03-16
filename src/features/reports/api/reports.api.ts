import { httpClient } from '@/shared/lib/http'
import { extractFilenameFromContentDisposition } from '@/shared/lib/fileDownload'
import {
  normalizeJournalBookReportPayload,
  normalizeLedgerReportPayload,
  normalizeTrialBalanceReportPayload,
} from '@/features/reports/adapters/reports.adapters'
import type {
  JournalBookReportParams,
  JournalBookReportResponse,
  LedgerReportParams,
  LedgerReportResponse,
  TrialBalanceReportParams,
  TrialBalanceReportResponse,
} from '@/features/reports/types/reports.types'

type DownloadResponse = {
  blob: Blob
  filename: string | null
}

export const reportsApi = {
  journalBook: (
    companyId: number,
    params: JournalBookReportParams = {}
  ): Promise<JournalBookReportResponse> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/reports/journal-book/`, {
        params: {
          ...(params.dateFrom ? { date_from: params.dateFrom } : null),
          ...(params.dateTo ? { date_to: params.dateTo } : null),
        },
      })
      .then((r) => normalizeJournalBookReportPayload(r.data, companyId, params)),

  ledger: (companyId: number, params: LedgerReportParams = {}): Promise<LedgerReportResponse> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/reports/ledger/`, {
        params: {
          ...(params.dateFrom ? { date_from: params.dateFrom } : null),
          ...(params.dateTo ? { date_to: params.dateTo } : null),
          ...(params.accountId ? { account_id: params.accountId } : null),
          include: 'account_options',
        },
      })
      .then((r) => normalizeLedgerReportPayload(r.data, companyId, params)),

  trialBalance: (
    companyId: number,
    params: TrialBalanceReportParams = {}
  ): Promise<TrialBalanceReportResponse> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/reports/trial-balance/`, {
        params: {
          ...(params.dateFrom ? { date_from: params.dateFrom } : null),
          ...(params.dateTo ? { date_to: params.dateTo } : null),
        },
      })
      .then((r) => normalizeTrialBalanceReportPayload(r.data, companyId, params)),

  downloadJournalBookXlsx: (
    companyId: number,
    params: JournalBookReportParams = {}
  ): Promise<DownloadResponse> =>
    httpClient
      .get<Blob>(`/companies/${companyId}/reports/journal-book.xlsx`, {
        responseType: 'blob',
        params: {
          ...(params.dateFrom ? { date_from: params.dateFrom } : null),
          ...(params.dateTo ? { date_to: params.dateTo } : null),
        },
      })
      .then((response) => ({
        blob: response.data,
        filename: extractFilenameFromContentDisposition(
          typeof response.headers['content-disposition'] === 'string'
            ? response.headers['content-disposition']
            : null
        ),
      })),

  downloadLedgerXlsx: (
    companyId: number,
    params: LedgerReportParams = {}
  ): Promise<DownloadResponse> =>
    httpClient
      .get<Blob>(`/companies/${companyId}/reports/ledger.xlsx`, {
        responseType: 'blob',
        params: {
          ...(params.dateFrom ? { date_from: params.dateFrom } : null),
          ...(params.dateTo ? { date_to: params.dateTo } : null),
          ...(params.accountId ? { account_id: params.accountId } : null),
        },
      })
      .then((response) => ({
        blob: response.data,
        filename: extractFilenameFromContentDisposition(
          typeof response.headers['content-disposition'] === 'string'
            ? response.headers['content-disposition']
            : null
        ),
      })),

  downloadTrialBalanceXlsx: (
    companyId: number,
    params: TrialBalanceReportParams = {}
  ): Promise<DownloadResponse> =>
    httpClient
      .get<Blob>(`/companies/${companyId}/reports/trial-balance.xlsx`, {
        responseType: 'blob',
        params: {
          ...(params.dateFrom ? { date_from: params.dateFrom } : null),
          ...(params.dateTo ? { date_to: params.dateTo } : null),
        },
      })
      .then((response) => ({
        blob: response.data,
        filename: extractFilenameFromContentDisposition(
          typeof response.headers['content-disposition'] === 'string'
            ? response.headers['content-disposition']
            : null
        ),
      })),
}
