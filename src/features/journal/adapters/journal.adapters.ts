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

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toDecimalString(value: unknown, fallback = '0'): string {
  if (typeof value === 'string' && value.trim().length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function normalizeLine(value: unknown): JournalLine | null {
  if (!isRecord(value)) return null
  const accountId = toNumberValue(value.account_id)
  if (accountId <= 0) return null

  const type = value.type === 'CREDIT' ? 'CREDIT' : 'DEBIT'
  const amount = toDecimalString(value.amount)

  return {
    account_id: accountId,
    account_code: typeof value.account_code === 'string' ? value.account_code : '',
    account_name: typeof value.account_name === 'string' ? value.account_name : '',
    type,
    amount,
  }
}

function normalizeEntry(value: unknown): JournalEntry | null {
  if (!isRecord(value)) return null
  const id = toNumberValue(value.id)
  if (id <= 0) return null

  return {
    id,
    entry_number: toNumberValue(value.entry_number),
    date: typeof value.date === 'string' ? value.date : '',
    description: typeof value.description === 'string' ? value.description : '',
    source_type: typeof value.source_type === 'string' ? value.source_type : '',
    source_ref: typeof value.source_ref === 'string' ? value.source_ref : '',
    created_by: typeof value.created_by === 'string' ? value.created_by : '',
    reversal_of_id: toNumberValue(value.reversal_of_id) || null,
    reversed_by_id: toNumberValue(value.reversed_by_id) || null,
    total_debit: toNumberValue(value.total_debit),
    total_credit: toNumberValue(value.total_credit),
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
