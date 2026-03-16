export interface JournalBookReportResponse {
  company_id: number
  company: string
  date_from: string | null
  date_to: string | null
  entries: JournalBookEntry[]
  grand_total_debit: number
  grand_total_credit: number
}

export interface JournalBookReportParams {
  dateFrom?: string
  dateTo?: string
}

export interface JournalBookLine {
  account_code: string
  account_name: string
  debit: number | null
  credit: number | null
}

export interface JournalBookEntry {
  entry_number: number
  date: string
  description: string
  source_type: string
  source_ref: string
  lines: JournalBookLine[]
  total_debit: number
  total_credit: number
}

export interface LedgerMovement {
  entry_number: number
  date: string
  description: string
  source_ref: string
  debit: number | null
  credit: number | null
  balance: number
}

export interface LedgerPeriodTotals {
  total_debit: number
  total_credit: number
}

export interface LedgerAccountCard {
  account_code: string
  account_name: string
  account_type: string
  normal_balance: 'DEBIT' | 'CREDIT'
  opening_balance: number
  movements: LedgerMovement[]
  period_totals: LedgerPeriodTotals
  closing_balance: number
}

export interface LedgerAccountOption {
  id: number
  code: string
  name: string
}

export interface LedgerReportResponse {
  company_id: number
  company: string
  date_from: string | null
  date_to: string | null
  account_id: number | null
  accounts: LedgerAccountCard[]
  account_options: LedgerAccountOption[]
}

export interface LedgerReportParams extends JournalBookReportParams {
  accountId?: number
}

export interface TrialBalanceAccountRow {
  account_code: string
  account_name: string
  account_type: string
  total_debit: number
  total_credit: number
  debit_balance: number | null
  credit_balance: number | null
}

export interface TrialBalanceGroupRow {
  account_code: string
  account_name: string
  account_type: string
  subtotal_debit: number
  subtotal_credit: number
  subtotal_debit_balance: number | null
  subtotal_credit_balance: number | null
  accounts: TrialBalanceAccountRow[]
}

export interface TrialBalanceTotals {
  total_debit: number
  total_credit: number
  total_debit_balance: number
  total_credit_balance: number
}

export interface TrialBalanceReportResponse {
  company_id: number
  company: string
  date_from: string | null
  date_to: string | null
  groups: TrialBalanceGroupRow[]
  grand_total_debit: number
  grand_total_credit: number
  totals: TrialBalanceTotals
}

export type TrialBalanceReportParams = JournalBookReportParams
