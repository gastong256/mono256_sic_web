import type { JournalLineType, JournalSourceType } from '@/features/journal/types/journal.types'
import type { LogicalExercise } from '@/features/companies/types/logicalExercises.types'

export interface ClosingState {
  company_id: number
  company: string
  books_closed_until: string | null
  last_patrimonial_closing_entry_id: number | null
  last_patrimonial_closing_date: string | null
  last_reopening_entry_id: number | null
  last_reopening_date: string | null
  current_exercise: LogicalExercise | null
  can_close: boolean
}

export interface CurrentBookBalanceSection {
  parent_code: string
  parent_name: string
  total_debit: string
  total_credit: string
  book_balance: string
}

export interface CurrentBookBalances {
  company_id: number
  company: string
  as_of_date: string
  books_closed_until: string | null
  cash: CurrentBookBalanceSection
  inventory: CurrentBookBalanceSection
}

export interface SimplifiedClosingRequest {
  closing_date: string
  reopening_date: string
  cash_actual?: string
  inventory_actual?: string
}

export type ClosingAdjustmentStatus = 'not_requested' | 'balanced' | 'shortage' | 'surplus'
export type ClosingNetResultKind = 'gain' | 'loss' | 'neutral'

export interface ClosingStatementAccountDetail {
  account_id: number | null
  account_code: string | null
  account_name: string
  account_type: string
  amount: string
}

export interface IncomeStatementAccountSummary {
  account_code: string | null
  account_name: string
  subtotal: string
  accounts: ClosingStatementAccountDetail[]
}

export interface IncomeStatementSection {
  accounts: IncomeStatementAccountSummary[]
  total: string
}

export interface IncomeStatement {
  date: string
  positive_results: IncomeStatementSection
  negative_results: IncomeStatementSection
  net_result: {
    amount: string
    kind: ClosingNetResultKind
  }
}

export interface BalanceSheetGroupSummary {
  account_code: string
  account_name: string
  subtotal: string
  accounts: ClosingStatementAccountDetail[]
}

export interface BalanceSheetSection {
  groups: BalanceSheetGroupSummary[]
  total: string
}

export interface BalanceSheet {
  date: string
  assets: BalanceSheetSection
  liabilities: BalanceSheetSection
  equity: BalanceSheetSection & {
    derived_result: {
      name: string
      amount: string
      kind: ClosingNetResultKind | null
    } | null
  }
  equation: {
    total_assets: string
    total_liabilities_plus_equity: string
    is_balanced: boolean
  }
}

export interface ClosingDraftLine {
  account_id: number | null
  account_code: string | null
  account_name: string
  parent_code: string | null
  type: JournalLineType
  amount: string
}

export interface ClosingDraftEntry {
  date: string
  description: string
  source_type: JournalSourceType
  source_ref: string
  total_debit: string
  total_credit: string
  lines: ClosingDraftLine[]
}

export interface ClosingAdjustmentSummary {
  book_balance: string | null
  actual_balance: string | null
  difference: string | null
  status: ClosingAdjustmentStatus
  entry: ClosingDraftEntry | null
}

export interface SimplifiedClosingPreview {
  company_id: number
  company: string
  closing_date: string
  reopening_date: string
  books_closed_until: string | null
  active_exercise: LogicalExercise | null
  previous_exercises: LogicalExercise[]
  adjustments: {
    cash: ClosingAdjustmentSummary
    inventory: ClosingAdjustmentSummary
  }
  result_summary: {
    negative_total: string
    positive_total: string
    net_result: string
    net_result_kind: ClosingNetResultKind
  }
  income_statement: IncomeStatement | null
  balance_sheet: BalanceSheet | null
  entries: {
    adjustments: ClosingDraftEntry[]
    result_closing: ClosingDraftEntry[]
    patrimonial_closing: ClosingDraftEntry | null
    reopening: ClosingDraftEntry | null
  }
}

export interface ClosingCreatedEntrySummary {
  id: number
  entry_number: number
  date: string
  description: string
  source_type: JournalSourceType
  source_ref: string
}

export interface SimplifiedClosingExecuteResponse {
  company_id: number
  company: string
  closing_date: string
  reopening_date: string
  books_closed_until: string | null
  snapshot_id: number | null
  created_entries: ClosingCreatedEntrySummary[]
}

export interface ClosingSnapshotLine {
  account_id: number | null
  account_code: string
  account_name: string
  account_type: string
  root_code: string
  parent_code: string | null
  debit_balance: string
  credit_balance: string
}

export interface ClosingSnapshot {
  id: number
  company_id: number
  company: string
  patrimonial_closing_entry_id: number | null
  reopening_entry_id: number | null
  closing_date: string
  reopening_date: string
  balance_sheet: BalanceSheet | null
  income_statement: IncomeStatement | null
  lines: ClosingSnapshotLine[]
}
