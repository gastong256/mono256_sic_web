import type { JournalEntryDetail } from '@/features/journal/types/journal.types'

export interface JournalBookReportResponse {
  company_id: number
  date_from: string | null
  date_to: string | null
  entries: JournalEntryDetail[]
  grand_total_debit: number
  grand_total_credit: number
}

export interface JournalBookReportParams {
  dateFrom?: string
  dateTo?: string
}

export interface LedgerMovement {
  entry_id: number
  entry_number: number
  date: string
  description: string
  debit: number
  credit: number
  balance: number
}

export interface LedgerAccountCard {
  account_id: number
  account_code: string
  account_name: string
  total_debit: number
  total_credit: number
  ending_balance: number
  movements: LedgerMovement[]
}

export interface LedgerReportResponse {
  company_id: number
  date_from: string | null
  date_to: string | null
  account_id: number | null
  cards: LedgerAccountCard[]
}

export interface LedgerReportParams extends JournalBookReportParams {
  accountId?: number
}

export interface TrialBalanceAccountRow {
  account_id: number
  code: string
  name: string
  total_debit: number
  total_credit: number
  balance: number
}

export interface TrialBalanceGroupRow {
  level2_id: number
  code: string
  name: string
  total_debit: number
  total_credit: number
  balance: number
  accounts: TrialBalanceAccountRow[]
}

export interface TrialBalanceReportResponse {
  company_id: number
  date_from: string | null
  date_to: string | null
  rows: TrialBalanceGroupRow[]
  grand_total_debit: number
  grand_total_credit: number
}

export type TrialBalanceReportParams = JournalBookReportParams
