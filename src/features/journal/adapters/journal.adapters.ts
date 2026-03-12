import type {
  JournalEntry,
  JournalEntryDetail,
  JournalLine,
} from '@/features/journal/types/journal.types'
import { extractListPayload } from '@/shared/lib/apiPagination'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function normalizeLine(value: unknown): JournalLine | null {
  if (!isRecord(value)) return null
  if (typeof value.account_id !== 'number') return null

  const type = value.type === 'CREDIT' ? 'CREDIT' : 'DEBIT'
  const amount =
    typeof value.amount === 'string'
      ? value.amount
      : typeof value.amount === 'number'
        ? String(value.amount)
        : '0'

  return {
    account_id: value.account_id,
    account_code: typeof value.account_code === 'string' ? value.account_code : '',
    account_name: typeof value.account_name === 'string' ? value.account_name : '',
    type,
    amount,
  }
}

function normalizeEntry(value: unknown): JournalEntry | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'number') return null

  return {
    id: value.id,
    entry_number: typeof value.entry_number === 'number' ? value.entry_number : 0,
    date: typeof value.date === 'string' ? value.date : '',
    description: typeof value.description === 'string' ? value.description : '',
    source_type: typeof value.source_type === 'string' ? value.source_type : '',
    source_ref: typeof value.source_ref === 'string' ? value.source_ref : '',
    created_by: typeof value.created_by === 'string' ? value.created_by : '',
    reversal_of_id: typeof value.reversal_of_id === 'number' ? value.reversal_of_id : null,
    reversed_by_id: typeof value.reversed_by_id === 'number' ? value.reversed_by_id : null,
    total_debit: typeof value.total_debit === 'number' ? value.total_debit : 0,
    total_credit: typeof value.total_credit === 'number' ? value.total_credit : 0,
  }
}

export function normalizeJournalEntryListPayload(payload: unknown): JournalEntry[] {
  return extractListPayload<unknown>(payload)
    .map(normalizeEntry)
    .filter((entry): entry is JournalEntry => entry !== null)
}

export function normalizeJournalEntryDetailPayload(payload: unknown): JournalEntryDetail {
  const normalized = normalizeEntry(payload)
  const linesRaw = isRecord(payload) && Array.isArray(payload.lines) ? payload.lines : []

  return {
    ...(normalized ?? {
      id: 0,
      entry_number: 0,
      date: '',
      description: '',
      source_type: '',
      source_ref: '',
      created_by: '',
      reversal_of_id: null,
      reversed_by_id: null,
      total_debit: 0,
      total_credit: 0,
    }),
    lines: linesRaw.map(normalizeLine).filter((line): line is JournalLine => line !== null),
  }
}
