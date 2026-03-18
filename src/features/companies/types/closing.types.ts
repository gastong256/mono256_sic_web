import type { JournalLineType, JournalSourceType } from '@/features/journal/types/journal.types'

export interface ClosingState {
  company_id: number
  company: string
  books_closed_until: string | null
  last_patrimonial_closing_entry_id: number | null
  last_patrimonial_closing_date: string | null
  last_reopening_entry_id: number | null
  last_reopening_date: string | null
  can_close: boolean
}

export interface SimplifiedClosingRequest {
  closing_date: string
  reopening_date: string
  cash_actual?: string
  inventory_actual?: string
}

export type ClosingAdjustmentStatus = 'not_requested' | 'balanced' | 'shortage' | 'surplus'
export type ClosingNetResultKind = 'gain' | 'loss' | 'neutral'

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
  adjustments: {
    cash: ClosingAdjustmentSummary
    inventory: ClosingAdjustmentSummary
  }
  result_summary: {
    total_negative: string
    total_positive: string
    net_result: string
    net_kind: ClosingNetResultKind
  }
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
  created_entries: ClosingCreatedEntrySummary[]
}
