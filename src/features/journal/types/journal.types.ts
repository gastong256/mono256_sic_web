export type JournalLineType = 'DEBIT' | 'CREDIT'

export interface JournalLine {
  account_id: number
  account_code: string
  account_name: string
  type: JournalLineType
  amount: string
}

export interface JournalEntry {
  id: number
  entry_number: number
  date: string // "YYYY-MM-DD"
  description: string
  source_type: string
  source_ref: string
  created_by: string
  total_debit: number
  total_credit: number
}

export interface JournalEntryDetail extends JournalEntry {
  lines: JournalLine[]
}

export interface CreateJournalLinePayload {
  account_id: number
  type: JournalLineType
  amount: string
}

export interface CreateJournalEntryPayload {
  date: string
  description: string
  lines: CreateJournalLinePayload[]
}
