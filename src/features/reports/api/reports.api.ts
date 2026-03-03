import { httpClient } from '@/shared/lib/http'
import type { JournalEntryDetail } from '@/features/journal/types/journal.types'
import type {
  JournalBookReportParams,
  JournalBookReportResponse,
  LedgerReportParams,
  LedgerReportResponse,
  TrialBalanceReportParams,
  TrialBalanceReportResponse,
} from '@/features/reports/types/reports.types'

type JournalBookApiResponse =
  | JournalBookReportResponse
  | {
      entries?: JournalEntryDetail[]
      results?: JournalEntryDetail[]
      grand_total_debit?: number
      grand_total_credit?: number
    }
  | JournalEntryDetail[]

function normalizeJournalBookResponse(
  payload: JournalBookApiResponse,
  companyId: number,
  params: JournalBookReportParams
): JournalBookReportResponse {
  if (Array.isArray(payload)) {
    const totalDebit = payload.reduce((acc, entry) => acc + entry.total_debit, 0)
    const totalCredit = payload.reduce((acc, entry) => acc + entry.total_credit, 0)
    return {
      company_id: companyId,
      date_from: params.dateFrom ?? null,
      date_to: params.dateTo ?? null,
      entries: payload,
      grand_total_debit: totalDebit,
      grand_total_credit: totalCredit,
    }
  }

  const entries =
    payload.entries ??
    ('results' in payload && Array.isArray(payload.results) ? payload.results : [])
  const totalDebit =
    payload.grand_total_debit ??
    entries.reduce((acc: number, entry: JournalEntryDetail) => acc + entry.total_debit, 0)
  const totalCredit =
    payload.grand_total_credit ??
    entries.reduce((acc: number, entry: JournalEntryDetail) => acc + entry.total_credit, 0)

  return {
    company_id: companyId,
    date_from: params.dateFrom ?? null,
    date_to: params.dateTo ?? null,
    entries,
    grand_total_debit: totalDebit,
    grand_total_credit: totalCredit,
  }
}

type LedgerApiResponse = LedgerReportResponse | { cards?: LedgerReportResponse['cards'] }

function normalizeLedgerResponse(
  payload: LedgerApiResponse,
  companyId: number,
  params: LedgerReportParams
): LedgerReportResponse {
  if ('company_id' in payload && 'cards' in payload) return payload

  return {
    company_id: companyId,
    date_from: params.dateFrom ?? null,
    date_to: params.dateTo ?? null,
    account_id: params.accountId ?? null,
    cards: payload.cards ?? [],
  }
}

type TrialBalanceApiResponse =
  | TrialBalanceReportResponse
  | {
      rows?: TrialBalanceReportResponse['rows']
      grand_total_debit?: number
      grand_total_credit?: number
    }

function normalizeTrialBalanceResponse(
  payload: TrialBalanceApiResponse,
  companyId: number,
  params: TrialBalanceReportParams
): TrialBalanceReportResponse {
  if ('company_id' in payload && 'rows' in payload) return payload

  const rows = payload.rows ?? []
  return {
    company_id: companyId,
    date_from: params.dateFrom ?? null,
    date_to: params.dateTo ?? null,
    rows,
    grand_total_debit:
      payload.grand_total_debit ?? rows.reduce((acc, row) => acc + row.total_debit, 0),
    grand_total_credit:
      payload.grand_total_credit ?? rows.reduce((acc, row) => acc + row.total_credit, 0),
  }
}

export const reportsApi = {
  journalBook: (
    companyId: number,
    params: JournalBookReportParams = {}
  ): Promise<JournalBookReportResponse> =>
    httpClient
      .get<JournalBookApiResponse>(`/companies/${companyId}/reports/journal-book/`, {
        params: {
          ...(params.dateFrom ? { date_from: params.dateFrom } : null),
          ...(params.dateTo ? { date_to: params.dateTo } : null),
        },
      })
      .then((r) => normalizeJournalBookResponse(r.data, companyId, params)),

  ledger: (companyId: number, params: LedgerReportParams = {}): Promise<LedgerReportResponse> =>
    httpClient
      .get<LedgerApiResponse>(`/companies/${companyId}/reports/ledger/`, {
        params: {
          ...(params.dateFrom ? { date_from: params.dateFrom } : null),
          ...(params.dateTo ? { date_to: params.dateTo } : null),
          ...(params.accountId ? { account_id: params.accountId } : null),
        },
      })
      .then((r) => normalizeLedgerResponse(r.data, companyId, params)),

  trialBalance: (
    companyId: number,
    params: TrialBalanceReportParams = {}
  ): Promise<TrialBalanceReportResponse> =>
    httpClient
      .get<TrialBalanceApiResponse>(`/companies/${companyId}/reports/trial-balance/`, {
        params: {
          ...(params.dateFrom ? { date_from: params.dateFrom } : null),
          ...(params.dateTo ? { date_to: params.dateTo } : null),
        },
      })
      .then((r) => normalizeTrialBalanceResponse(r.data, companyId, params)),
}
