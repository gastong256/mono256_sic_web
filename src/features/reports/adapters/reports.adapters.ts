import { normalizeLogicalExercisesPayload } from '@/features/companies/adapters/closing.adapters'
import type {
  JournalBookEntry,
  JournalBookReportParams,
  JournalBookReportResponse,
  LedgerAccountOption,
  LedgerMovement,
  LedgerReportParams,
  LedgerReportResponse,
  TrialBalanceReportParams,
  TrialBalanceReportResponse,
} from '@/features/reports/types/reports.types'
import { extractListPayload } from '@/shared/lib/apiPagination'
import {
  isRecord,
  toNullableNumberValue,
  toNumberValue,
  toStringValue,
  type UnknownRecord,
} from '@/shared/lib/valueParsers'

function normalizeExerciseMetadata(payload: unknown) {
  const raw = isRecord(payload) ? payload : {}
  const previousExercises = Array.isArray(raw.previous_exercises) ? raw.previous_exercises : []
  const requestedRange = isRecord(raw.requested_range) ? raw.requested_range : null
  const exerciseRange = isRecord(raw.exercise_range) ? raw.exercise_range : null
  const visibleRange = isRecord(raw.visible_range) ? raw.visible_range : null
  const requestedDateFrom =
    toStringValue(raw.requested_date_from) || toStringValue(requestedRange?.date_from) || null
  const requestedDateTo =
    toStringValue(raw.requested_date_to) || toStringValue(requestedRange?.date_to) || null

  return {
    requested_date_from: requestedDateFrom,
    requested_date_to: requestedDateTo,
    requested_range:
      requestedDateFrom !== null || requestedDateTo !== null
        ? {
            date_from: requestedDateFrom,
            date_to: requestedDateTo,
          }
        : null,
    exercise_range: exerciseRange
      ? {
          date_from: toStringValue(exerciseRange.date_from) || null,
          date_to: toStringValue(exerciseRange.date_to) || null,
          status: exerciseRange.status === 'closed' ? ('closed' as const) : ('open' as const),
        }
      : null,
    visible_range: visibleRange
      ? {
          date_from: toStringValue(visibleRange.date_from) || null,
          date_to: toStringValue(visibleRange.date_to) || null,
        }
      : null,
    active_exercise:
      normalizeLogicalExercisesPayload({
        company_id: 0,
        company: '',
        current_exercise_id: isRecord(raw.active_exercise) ? raw.active_exercise.exercise_id : null,
        exercises: raw.active_exercise ? [raw.active_exercise] : [],
      }).exercises[0] ?? null,
    previous_exercises: normalizeLogicalExercisesPayload({
      company_id: 0,
      company: '',
      current_exercise_id: null,
      exercises: previousExercises,
    }).exercises,
  }
}

function normalizeJournalBookLines(payload: unknown): JournalBookEntry['lines'] {
  return extractListPayload<unknown>(payload)
    .map((line) => {
      if (!isRecord(line)) return null
      return {
        account_code: toStringValue(line.account_code),
        account_name: toStringValue(line.account_name),
        debit: toNullableNumberValue(line.debit),
        credit: toNullableNumberValue(line.credit),
      }
    })
    .filter((line): line is JournalBookEntry['lines'][number] => line !== null)
}

function normalizeJournalEntries(payload: unknown): JournalBookEntry[] {
  return extractListPayload<unknown>(payload)
    .map((entry) => {
      if (!isRecord(entry)) return null
      return {
        entry_number: toNumberValue(entry.entry_number),
        date: toStringValue(entry.date),
        description: toStringValue(entry.description),
        source_type: toStringValue(entry.source_type),
        source_ref: toStringValue(entry.source_ref),
        lines: normalizeJournalBookLines(entry.lines),
        total_debit: toNumberValue(entry.total_debit),
        total_credit: toNumberValue(entry.total_credit),
      }
    })
    .filter((entry): entry is JournalBookEntry => entry !== null && entry.entry_number > 0)
}

export function normalizeJournalBookReportPayload(
  payload: unknown,
  companyId: number,
  params: JournalBookReportParams
): JournalBookReportResponse {
  const entries =
    isRecord(payload) && Array.isArray(payload.entries)
      ? normalizeJournalEntries(payload.entries)
      : normalizeJournalEntries(payload)

  const totals = isRecord(payload) && isRecord(payload.totals) ? payload.totals : null
  const totalDebit =
    toNumberValue(totals?.total_debit, NaN) ||
    toNumberValue((payload as UnknownRecord | undefined)?.grand_total_debit, NaN) ||
    entries.reduce((acc, entry) => acc + entry.total_debit, 0)
  const totalCredit =
    toNumberValue(totals?.total_credit, NaN) ||
    toNumberValue((payload as UnknownRecord | undefined)?.grand_total_credit, NaN) ||
    entries.reduce((acc, entry) => acc + entry.total_credit, 0)

  return {
    company_id: isRecord(payload) ? toNumberValue(payload.company_id, companyId) : companyId,
    company: isRecord(payload) ? toStringValue(payload.company) : '',
    date_from: isRecord(payload)
      ? toStringValue(payload.date_from) || params.dateFrom || null
      : (params.dateFrom ?? null),
    date_to: isRecord(payload)
      ? toStringValue(payload.date_to) || params.dateTo || null
      : (params.dateTo ?? null),
    ...normalizeExerciseMetadata(payload),
    entries,
    grand_total_debit: Number.isFinite(totalDebit) ? totalDebit : 0,
    grand_total_credit: Number.isFinite(totalCredit) ? totalCredit : 0,
  }
}

function normalizeLedgerMovements(raw: unknown): LedgerMovement[] {
  return extractListPayload<unknown>(raw)
    .map((movement) => {
      if (!isRecord(movement)) return null
      return {
        entry_number: toNumberValue(movement.entry_number),
        date: toStringValue(movement.date),
        description: toStringValue(movement.description),
        source_ref: toStringValue(movement.source_ref),
        debit: toNullableNumberValue(movement.debit),
        credit: toNullableNumberValue(movement.credit),
        balance: toNumberValue(movement.balance),
      }
    })
    .filter((movement): movement is LedgerMovement => movement !== null)
}

function normalizeLedgerAccountOptions(raw: unknown): LedgerAccountOption[] {
  return extractListPayload<unknown>(raw)
    .map((option) => {
      if (!isRecord(option)) return null
      const id = toNumberValue(option.id)
      const code = toStringValue(option.code)
      const name = toStringValue(option.name)
      if (id <= 0 || code.length === 0 || name.length === 0) return null
      return { id, code, name }
    })
    .filter((option): option is LedgerAccountOption => option !== null)
}

export function normalizeLedgerReportPayload(
  payload: unknown,
  companyId: number,
  params: LedgerReportParams
): LedgerReportResponse {
  const rawAccounts =
    isRecord(payload) && Array.isArray(payload.accounts)
      ? payload.accounts
      : extractListPayload<unknown>(payload)

  const accounts = rawAccounts
    .map((account) => {
      if (!isRecord(account)) return null
      const accountCode = toStringValue(account.account_code ?? account.code)
      const accountName = toStringValue(account.account_name ?? account.name)
      if (accountCode.length === 0 || accountName.length === 0) return null
      const periodTotals = isRecord(account.period_totals) ? account.period_totals : null

      return {
        account_code: accountCode,
        account_name: accountName,
        account_type: toStringValue(account.account_type),
        normal_balance: toStringValue(account.normal_balance) === 'CREDIT' ? 'CREDIT' : 'DEBIT',
        opening_balance: toNumberValue(account.opening_balance),
        movements: normalizeLedgerMovements(account.movements ?? account.entries),
        period_totals: {
          total_debit: toNumberValue(periodTotals?.total_debit ?? account.total_debit),
          total_credit: toNumberValue(periodTotals?.total_credit ?? account.total_credit),
        },
        closing_balance: toNumberValue(account.closing_balance ?? account.ending_balance),
      }
    })
    .filter((account): account is LedgerReportResponse['accounts'][number] => account !== null)

  return {
    company_id: isRecord(payload) ? toNumberValue(payload.company_id, companyId) : companyId,
    company: isRecord(payload) ? toStringValue(payload.company) : '',
    date_from: isRecord(payload)
      ? toStringValue(payload.date_from) || params.dateFrom || null
      : (params.dateFrom ?? null),
    date_to: isRecord(payload)
      ? toStringValue(payload.date_to) || params.dateTo || null
      : (params.dateTo ?? null),
    ...normalizeExerciseMetadata(payload),
    account_id: isRecord(payload)
      ? toNumberValue(payload.account_id, params.accountId ?? 0) || null
      : (params.accountId ?? null),
    accounts,
    account_options: isRecord(payload)
      ? normalizeLedgerAccountOptions(payload.account_options)
      : [],
  }
}

export function normalizeTrialBalanceReportPayload(
  payload: unknown,
  companyId: number,
  params: TrialBalanceReportParams
): TrialBalanceReportResponse {
  const groups =
    isRecord(payload) && Array.isArray(payload.groups)
      ? payload.groups
      : extractListPayload<unknown>(payload)

  const normalizedGroups = groups
    .map((group) => {
      if (!isRecord(group)) return null
      const accounts = extractListPayload<unknown>(group.accounts).map((account) => {
        if (!isRecord(account)) return null
        return {
          account_code: toStringValue(account.account_code ?? account.code),
          account_name: toStringValue(account.account_name ?? account.name),
          account_type: toStringValue(account.account_type),
          total_debit: toNumberValue(account.total_debit),
          total_credit: toNumberValue(account.total_credit),
          debit_balance: toNullableNumberValue(account.debit_balance),
          credit_balance: toNullableNumberValue(account.credit_balance),
        }
      })

      return {
        account_code: toStringValue(group.account_code ?? group.code),
        account_name: toStringValue(group.account_name ?? group.name),
        account_type: toStringValue(group.account_type),
        subtotal_debit: toNumberValue(group.subtotal_debit ?? group.total_debit),
        subtotal_credit: toNumberValue(group.subtotal_credit ?? group.total_credit),
        subtotal_debit_balance: toNullableNumberValue(
          group.subtotal_debit_balance ?? group.debit_balance
        ),
        subtotal_credit_balance: toNullableNumberValue(
          group.subtotal_credit_balance ?? group.credit_balance
        ),
        accounts: accounts.filter(
          (account): account is TrialBalanceReportResponse['groups'][number]['accounts'][number] =>
            account !== null && account.account_code.length > 0 && account.account_name.length > 0
        ),
      }
    })
    .filter(
      (group): group is TrialBalanceReportResponse['groups'][number] =>
        group !== null && group.account_code.length > 0 && group.account_name.length > 0
    )

  const totals = isRecord(payload) && isRecord(payload.totals) ? payload.totals : null
  const grandTotalDebit =
    toNumberValue(totals?.total_debit, NaN) ||
    toNumberValue((payload as UnknownRecord | undefined)?.grand_total_debit, NaN) ||
    normalizedGroups.reduce((acc, group) => acc + group.subtotal_debit, 0)
  const grandTotalCredit =
    toNumberValue(totals?.total_credit, NaN) ||
    toNumberValue((payload as UnknownRecord | undefined)?.grand_total_credit, NaN) ||
    normalizedGroups.reduce((acc, group) => acc + group.subtotal_credit, 0)

  return {
    company_id: isRecord(payload) ? toNumberValue(payload.company_id, companyId) : companyId,
    company: isRecord(payload) ? toStringValue(payload.company) : '',
    date_from: isRecord(payload)
      ? toStringValue(payload.date_from) || params.dateFrom || null
      : (params.dateFrom ?? null),
    date_to: isRecord(payload)
      ? toStringValue(payload.date_to) || params.dateTo || null
      : (params.dateTo ?? null),
    ...normalizeExerciseMetadata(payload),
    groups: normalizedGroups,
    grand_total_debit: Number.isFinite(grandTotalDebit) ? grandTotalDebit : 0,
    grand_total_credit: Number.isFinite(grandTotalCredit) ? grandTotalCredit : 0,
    totals: {
      total_debit: toNumberValue(totals?.total_debit, grandTotalDebit),
      total_credit: toNumberValue(totals?.total_credit, grandTotalCredit),
      total_debit_balance: toNumberValue(totals?.total_debit_balance),
      total_credit_balance: toNumberValue(totals?.total_credit_balance),
    },
  }
}
