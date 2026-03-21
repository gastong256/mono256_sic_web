import type {
  BalanceSheet,
  BalanceSheetGroupSummary,
  ClosingNetResultKind,
  CurrentBookBalances,
  CurrentBookBalanceSection,
  ClosingStatementAccountDetail,
  ClosingSnapshot,
  ClosingSnapshotLine,
  ClosingAdjustmentSummary,
  ClosingDraftEntry,
  ClosingDraftLine,
  ClosingState,
  IncomeStatement,
  IncomeStatementAccountSummary,
  SimplifiedClosingExecuteResponse,
  SimplifiedClosingPreview,
} from '@/features/companies/types/closing.types'
import type {
  LogicalExercise,
  LogicalExerciseListResponse,
} from '@/features/companies/types/logicalExercises.types'
import {
  isRecord,
  toDecimalString,
  toNullableNumberValue,
  toStringOrNull,
  toStringValue,
} from '@/shared/lib/valueParsers'

function normalizeLogicalExercise(raw: unknown): LogicalExercise | null {
  if (!isRecord(raw)) return null

  const exerciseId = toStringValue(raw.exercise_id)
  const openingEntryId = toNullableNumberValue(raw.opening_entry_id)
  if (exerciseId.length === 0 || openingEntryId === null) return null

  return {
    exercise_id: exerciseId,
    exercise_index: Math.max(1, toNullableNumberValue(raw.exercise_index) ?? 1),
    opening_entry_id: openingEntryId,
    opening_source_type: toStringValue(raw.opening_source_type),
    start_date: toStringValue(raw.start_date),
    closing_entry_id: toNullableNumberValue(raw.closing_entry_id),
    closing_date: toStringOrNull(raw.closing_date),
    snapshot_id: toNullableNumberValue(raw.snapshot_id),
    status: raw.status === 'closed' ? 'closed' : 'open',
  }
}

function normalizeCurrentBookBalanceSection(raw: unknown): CurrentBookBalanceSection {
  const section = isRecord(raw) ? raw : {}

  return {
    parent_code: toStringValue(section.parent_code),
    parent_name: toStringValue(section.parent_name),
    total_debit: toDecimalString(section.total_debit, '0.00'),
    total_credit: toDecimalString(section.total_credit, '0.00'),
    book_balance: toDecimalString(section.book_balance, '0.00'),
  }
}

function normalizeNetResultKind(value: unknown): ClosingNetResultKind {
  return value === 'gain' || value === 'loss' || value === 'neutral' ? value : 'neutral'
}

function normalizeStatementAccountDetails(raw: unknown): ClosingStatementAccountDetail[] {
  const accounts = Array.isArray(raw) ? raw : []
  return accounts
    .map((account) => {
      if (!isRecord(account)) return null
      const accountName = toStringValue(account.account_name)
      if (accountName.length === 0) return null

      return {
        account_id: toNullableNumberValue(account.account_id),
        account_code: toStringOrNull(account.account_code),
        account_name: accountName,
        account_type: toStringValue(account.account_type),
        amount: toDecimalString(account.amount, '0.00'),
      }
    })
    .filter((account): account is ClosingStatementAccountDetail => account !== null)
}

function normalizeIncomeStatementAccounts(raw: unknown): IncomeStatementAccountSummary[] {
  const accounts = Array.isArray(raw) ? raw : []
  return accounts
    .map((account) => {
      if (!isRecord(account)) return null
      const accountName = toStringValue(account.account_name)
      if (accountName.length === 0) return null

      return {
        account_code: toStringOrNull(account.account_code),
        account_name: accountName,
        subtotal: toDecimalString(account.subtotal ?? account.amount, '0.00'),
        accounts: normalizeStatementAccountDetails(account.accounts),
      }
    })
    .filter((account): account is IncomeStatementAccountSummary => account !== null)
}

function normalizeIncomeStatement(raw: unknown): IncomeStatement | null {
  if (!isRecord(raw)) return null
  const positive = isRecord(raw.positive_results) ? raw.positive_results : {}
  const negative = isRecord(raw.negative_results) ? raw.negative_results : {}
  const net = isRecord(raw.net_result) ? raw.net_result : {}

  return {
    date: toStringValue(raw.date),
    positive_results: {
      accounts: normalizeIncomeStatementAccounts(positive.accounts),
      total: toDecimalString(positive.total, '0.00'),
    },
    negative_results: {
      accounts: normalizeIncomeStatementAccounts(negative.accounts),
      total: toDecimalString(negative.total, '0.00'),
    },
    net_result: {
      amount: toDecimalString(net.amount, '0.00'),
      kind: normalizeNetResultKind(net.kind),
    },
  }
}

function normalizeBalanceSheetGroups(raw: unknown): BalanceSheetGroupSummary[] {
  const groups = Array.isArray(raw) ? raw : []
  return groups
    .map((group) => {
      if (!isRecord(group)) return null
      const accountCode = toStringValue(group.account_code)
      const accountName = toStringValue(group.account_name)
      if (accountCode.length === 0 || accountName.length === 0) return null
      return {
        account_code: accountCode,
        account_name: accountName,
        subtotal: toDecimalString(group.subtotal ?? group.amount, '0.00'),
        accounts: normalizeStatementAccountDetails(group.accounts),
      }
    })
    .filter((group): group is BalanceSheetGroupSummary => group !== null)
}

function normalizeBalanceSheet(raw: unknown): BalanceSheet | null {
  if (!isRecord(raw)) return null
  const assets = isRecord(raw.assets) ? raw.assets : {}
  const liabilities = isRecord(raw.liabilities) ? raw.liabilities : {}
  const equity = isRecord(raw.equity) ? raw.equity : {}
  const equation = isRecord(raw.equation) ? raw.equation : {}
  const derivedResult = isRecord(equity.derived_result) ? equity.derived_result : null

  return {
    date: toStringValue(raw.date),
    assets: {
      groups: normalizeBalanceSheetGroups(assets.groups),
      total: toDecimalString(assets.total, '0.00'),
    },
    liabilities: {
      groups: normalizeBalanceSheetGroups(liabilities.groups),
      total: toDecimalString(liabilities.total, '0.00'),
    },
    equity: {
      groups: normalizeBalanceSheetGroups(equity.groups),
      total: toDecimalString(equity.total, '0.00'),
      derived_result: derivedResult
        ? {
            name: toStringValue(derivedResult.name),
            amount: toDecimalString(derivedResult.amount, '0.00'),
            kind: derivedResult.kind === null ? null : normalizeNetResultKind(derivedResult.kind),
          }
        : null,
    },
    equation: {
      total_assets: toDecimalString(equation.total_assets, '0.00'),
      total_liabilities_plus_equity: toDecimalString(
        equation.total_liabilities_plus_equity,
        '0.00'
      ),
      is_balanced: equation.is_balanced === true,
    },
  }
}

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
    current_exercise: normalizeLogicalExercise(raw.current_exercise),
    can_close: raw.can_close === true,
  }
}

export function normalizeCurrentBookBalancesPayload(payload: unknown): CurrentBookBalances {
  const raw = isRecord(payload) ? payload : {}

  return {
    company_id: typeof raw.company_id === 'number' ? raw.company_id : 0,
    company: toStringValue(raw.company),
    as_of_date: toStringValue(raw.as_of_date),
    books_closed_until: toStringOrNull(raw.books_closed_until),
    cash: normalizeCurrentBookBalanceSection(raw.cash),
    inventory: normalizeCurrentBookBalanceSection(raw.inventory),
  }
}

export function normalizeLogicalExercisesPayload(payload: unknown): LogicalExerciseListResponse {
  const raw = isRecord(payload) ? payload : {}
  const exercises = Array.isArray(raw.exercises) ? raw.exercises : []

  return {
    company_id: typeof raw.company_id === 'number' ? raw.company_id : 0,
    company: toStringValue(raw.company),
    current_exercise_id: toStringOrNull(raw.current_exercise_id),
    exercises: exercises
      .map(normalizeLogicalExercise)
      .filter((exercise): exercise is LogicalExercise => exercise !== null),
  }
}

export function normalizeClosingPreviewPayload(payload: unknown): SimplifiedClosingPreview {
  const raw = isRecord(payload) ? payload : {}
  const adjustments = isRecord(raw.adjustments) ? raw.adjustments : {}
  const entries = isRecord(raw.entries) ? raw.entries : {}
  const resultSummary = isRecord(raw.result_summary) ? raw.result_summary : {}

  return {
    company_id: typeof raw.company_id === 'number' ? raw.company_id : 0,
    company: toStringValue(raw.company),
    closing_date: toStringValue(raw.closing_date),
    reopening_date: toStringValue(raw.reopening_date),
    books_closed_until: toStringOrNull(raw.books_closed_until),
    active_exercise: normalizeLogicalExercise(raw.active_exercise),
    previous_exercises: (Array.isArray(raw.previous_exercises) ? raw.previous_exercises : [])
      .map(normalizeLogicalExercise)
      .filter((exercise): exercise is LogicalExercise => exercise !== null),
    adjustments: {
      cash: normalizeAdjustmentSummary(adjustments.cash),
      inventory: normalizeAdjustmentSummary(adjustments.inventory),
    },
    result_summary: {
      negative_total: toDecimalString(
        resultSummary.negative_total ?? resultSummary.total_negative,
        '0.00'
      ),
      positive_total: toDecimalString(
        resultSummary.positive_total ?? resultSummary.total_positive,
        '0.00'
      ),
      net_result: toDecimalString(resultSummary.net_result, '0.00'),
      net_result_kind: normalizeNetResultKind(
        resultSummary.net_result_kind ?? resultSummary.net_kind
      ),
    },
    income_statement: normalizeIncomeStatement(raw.income_statement),
    balance_sheet: normalizeBalanceSheet(raw.balance_sheet),
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
    snapshot_id: toNullableNumberValue(raw.snapshot_id),
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

export function normalizeClosingSnapshotPayload(payload: unknown): ClosingSnapshot {
  const raw = isRecord(payload) ? payload : {}
  const lines = Array.isArray(raw.lines) ? raw.lines : []

  return {
    id: toNullableNumberValue(raw.id) ?? 0,
    company_id: toNullableNumberValue(raw.company_id) ?? 0,
    company: toStringValue(raw.company),
    patrimonial_closing_entry_id: toNullableNumberValue(raw.patrimonial_closing_entry_id),
    reopening_entry_id: toNullableNumberValue(raw.reopening_entry_id),
    closing_date: toStringValue(raw.closing_date),
    reopening_date: toStringValue(raw.reopening_date),
    balance_sheet: normalizeBalanceSheet(raw.balance_sheet),
    income_statement: normalizeIncomeStatement(raw.income_statement),
    lines: lines
      .map((line) => {
        if (!isRecord(line)) return null
        const accountCode = toStringValue(line.account_code)
        const accountName = toStringValue(line.account_name)
        if (accountCode.length === 0 || accountName.length === 0) return null
        return {
          account_id: toNullableNumberValue(line.account_id),
          account_code: accountCode,
          account_name: accountName,
          account_type: toStringValue(line.account_type),
          root_code: toStringValue(line.root_code),
          parent_code: toStringOrNull(line.parent_code),
          debit_balance: toDecimalString(line.debit_balance, '0.00'),
          credit_balance: toDecimalString(line.credit_balance, '0.00'),
        }
      })
      .filter((line): line is ClosingSnapshotLine => line !== null),
  }
}
