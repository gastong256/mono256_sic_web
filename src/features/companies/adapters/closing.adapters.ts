import type {
  ClosingAdjustmentSummary,
  ClosingDraftEntry,
  ClosingDraftLine,
  ClosingState,
  SimplifiedClosingExecuteResponse,
  SimplifiedClosingPreview,
} from '@/features/companies/types/closing.types'
import {
  isRecord,
  toDecimalString,
  toNullableNumberValue,
  toStringOrNull,
  toStringValue,
} from '@/shared/lib/valueParsers'

function normalizeDraftLine(raw: unknown): ClosingDraftLine | null {
  if (!isRecord(raw)) return null

  return {
    account_id: toNullableNumberValue(raw.account_id),
    account_code: toStringOrNull(raw.account_code),
    account_name: toStringValue(raw.account_name),
    parent_code: toStringOrNull(raw.parent_code),
    type: raw.type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
    amount: toDecimalString(raw.amount, '0.00'),
  }
}

function normalizeDraftEntry(raw: unknown): ClosingDraftEntry | null {
  if (!isRecord(raw)) return null
  const lines = Array.isArray(raw.lines) ? raw.lines : []

  return {
    date: toStringValue(raw.date),
    description: toStringValue(raw.description),
    source_type: toStringValue(raw.source_type),
    source_ref: toStringValue(raw.source_ref),
    total_debit: toDecimalString(raw.total_debit, '0.00'),
    total_credit: toDecimalString(raw.total_credit, '0.00'),
    lines: lines.map(normalizeDraftLine).filter((line): line is ClosingDraftLine => line !== null),
  }
}

function normalizeAdjustmentSummary(raw: unknown): ClosingAdjustmentSummary {
  if (!isRecord(raw)) {
    return {
      book_balance: null,
      actual_balance: null,
      difference: null,
      status: 'not_requested',
      entry: null,
    }
  }

  const status =
    raw.status === 'balanced' ||
    raw.status === 'shortage' ||
    raw.status === 'surplus' ||
    raw.status === 'not_requested'
      ? raw.status
      : 'not_requested'

  return {
    book_balance: toStringOrNull(raw.book_balance),
    actual_balance: toStringOrNull(raw.actual_balance),
    difference: toStringOrNull(raw.difference),
    status,
    entry: normalizeDraftEntry(raw.entry),
  }
}

export function normalizeClosingStatePayload(payload: unknown): ClosingState {
  const raw = isRecord(payload) ? payload : {}

  return {
    company_id: typeof raw.company_id === 'number' ? raw.company_id : 0,
    company: toStringValue(raw.company),
    books_closed_until: toStringOrNull(raw.books_closed_until),
    last_patrimonial_closing_entry_id: toNullableNumberValue(raw.last_patrimonial_closing_entry_id),
    last_patrimonial_closing_date: toStringOrNull(raw.last_patrimonial_closing_date),
    last_reopening_entry_id: toNullableNumberValue(raw.last_reopening_entry_id),
    last_reopening_date: toStringOrNull(raw.last_reopening_date),
    can_close: raw.can_close === true,
  }
}

export function normalizeClosingPreviewPayload(payload: unknown): SimplifiedClosingPreview {
  const raw = isRecord(payload) ? payload : {}
  const adjustments = isRecord(raw.adjustments) ? raw.adjustments : {}
  const entries = isRecord(raw.entries) ? raw.entries : {}

  return {
    company_id: typeof raw.company_id === 'number' ? raw.company_id : 0,
    company: toStringValue(raw.company),
    closing_date: toStringValue(raw.closing_date),
    reopening_date: toStringValue(raw.reopening_date),
    books_closed_until: toStringOrNull(raw.books_closed_until),
    adjustments: {
      cash: normalizeAdjustmentSummary(adjustments.cash),
      inventory: normalizeAdjustmentSummary(adjustments.inventory),
    },
    result_summary: {
      total_negative: toDecimalString(
        isRecord(raw.result_summary) ? raw.result_summary.total_negative : null,
        '0.00'
      ),
      total_positive: toDecimalString(
        isRecord(raw.result_summary) ? raw.result_summary.total_positive : null,
        '0.00'
      ),
      net_result: toDecimalString(
        isRecord(raw.result_summary) ? raw.result_summary.net_result : null,
        '0.00'
      ),
      net_kind:
        isRecord(raw.result_summary) &&
        (raw.result_summary.net_kind === 'gain' ||
          raw.result_summary.net_kind === 'loss' ||
          raw.result_summary.net_kind === 'neutral')
          ? raw.result_summary.net_kind
          : 'neutral',
    },
    entries: {
      adjustments: (Array.isArray(entries.adjustments) ? entries.adjustments : [])
        .map(normalizeDraftEntry)
        .filter((entry): entry is ClosingDraftEntry => entry !== null),
      result_closing: (Array.isArray(entries.result_closing) ? entries.result_closing : [])
        .map(normalizeDraftEntry)
        .filter((entry): entry is ClosingDraftEntry => entry !== null),
      patrimonial_closing: normalizeDraftEntry(entries.patrimonial_closing),
      reopening: normalizeDraftEntry(entries.reopening),
    },
  }
}

export function normalizeClosingExecutePayload(payload: unknown): SimplifiedClosingExecuteResponse {
  const raw = isRecord(payload) ? payload : {}
  const createdEntries = Array.isArray(raw.created_entries) ? raw.created_entries : []

  return {
    company_id: typeof raw.company_id === 'number' ? raw.company_id : 0,
    company: toStringValue(raw.company),
    closing_date: toStringValue(raw.closing_date),
    reopening_date: toStringValue(raw.reopening_date),
    books_closed_until: toStringOrNull(raw.books_closed_until),
    created_entries: createdEntries
      .map((entry) => {
        if (!isRecord(entry)) return null
        const id = toNullableNumberValue(entry.id)
        const entryNumber = toNullableNumberValue(entry.entry_number)
        if (id === null || entryNumber === null) return null

        return {
          id,
          entry_number: entryNumber,
          date: toStringValue(entry.date),
          description: toStringValue(entry.description),
          source_type: toStringValue(entry.source_type),
          source_ref: toStringValue(entry.source_ref),
        }
      })
      .filter(
        (entry): entry is SimplifiedClosingExecuteResponse['created_entries'][number] =>
          entry !== null
      ),
  }
}
