import type { JournalEntryDetail } from '@/features/journal/types/journal.types'
import { normalizeJournalEntryDetailPayload } from '@/features/journal/adapters/journal.adapters'
import type {
  JournalBookReportParams,
  JournalBookReportResponse,
  LedgerMovement,
  LedgerReportParams,
  LedgerReportResponse,
  TrialBalanceReportParams,
  TrialBalanceReportResponse,
} from '@/features/reports/types/reports.types'
import { extractListPayload } from '@/shared/lib/apiPagination'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function toNullableNumberValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = toNumberValue(value, NaN)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeJournalEntries(payload: unknown): JournalEntryDetail[] {
  return extractListPayload<unknown>(payload)
    .map(normalizeJournalEntryDetailPayload)
    .filter((entry) => entry.id > 0)
}

export function normalizeJournalBookReportPayload(
  payload: unknown,
  companyId: number,
  params: JournalBookReportParams
): JournalBookReportResponse {
  const entries =
    isRecord(payload) && Array.isArray(payload.entries)
      ? normalizeJournalEntries(payload.entries)
      : isRecord(payload) && Array.isArray(payload.results)
        ? normalizeJournalEntries(payload.results)
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
    date_from: isRecord(payload)
      ? toStringValue(payload.date_from) || params.dateFrom || null
      : (params.dateFrom ?? null),
    date_to: isRecord(payload)
      ? toStringValue(payload.date_to) || params.dateTo || null
      : (params.dateTo ?? null),
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

export function normalizeLedgerReportPayload(
  payload: unknown,
  companyId: number,
  params: LedgerReportParams
): LedgerReportResponse {
  const rawAccounts =
    isRecord(payload) && Array.isArray(payload.accounts)
      ? payload.accounts
      : isRecord(payload) && Array.isArray(payload.cards)
        ? payload.cards
        : extractListPayload<unknown>(payload)

  const cards = rawAccounts
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
    .filter((card): card is LedgerReportResponse['cards'][number] => card !== null)

  return {
    company_id: isRecord(payload) ? toNumberValue(payload.company_id, companyId) : companyId,
    company: isRecord(payload) ? toStringValue(payload.company) : '',
    date_from: isRecord(payload)
      ? toStringValue(payload.date_from) || params.dateFrom || null
      : (params.dateFrom ?? null),
    date_to: isRecord(payload)
      ? toStringValue(payload.date_to) || params.dateTo || null
      : (params.dateTo ?? null),
    account_id: isRecord(payload)
      ? toNumberValue(payload.account_id, params.accountId ?? 0) || null
      : (params.accountId ?? null),
    cards,
    accounts: cards,
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
      : isRecord(payload) && Array.isArray(payload.rows)
        ? payload.rows
        : extractListPayload<unknown>(payload)

  const rows = groups
    .map((group) => {
      if (!isRecord(group)) return null
      const accounts = extractListPayload<unknown>(group.accounts ?? group.rows).map((account) => {
        if (!isRecord(account)) return null
        const accountId = toNumberValue(account.account_id ?? account.id)
        if (accountId <= 0) return null
        return {
          account_id: accountId,
          code: toStringValue(account.code ?? account.account_code),
          name: toStringValue(account.name ?? account.account_name),
          total_debit: toNumberValue(account.total_debit),
          total_credit: toNumberValue(account.total_credit),
          balance: toNumberValue(account.balance),
        }
      })

      return {
        level2_id: toNumberValue(group.level2_id ?? group.id),
        code: toStringValue(group.code),
        name: toStringValue(group.name),
        total_debit: toNumberValue(group.total_debit),
        total_credit: toNumberValue(group.total_credit),
        balance: toNumberValue(group.balance),
        accounts: accounts.filter(
          (account): account is TrialBalanceReportResponse['rows'][number]['accounts'][number] =>
            account !== null
        ),
      }
    })
    .filter((row): row is TrialBalanceReportResponse['rows'][number] => row !== null)

  const totals = isRecord(payload) && isRecord(payload.totals) ? payload.totals : null
  const grandTotalDebit =
    toNumberValue(totals?.total_debit, NaN) ||
    toNumberValue((payload as UnknownRecord | undefined)?.grand_total_debit, NaN) ||
    rows.reduce((acc, row) => acc + row.total_debit, 0)
  const grandTotalCredit =
    toNumberValue(totals?.total_credit, NaN) ||
    toNumberValue((payload as UnknownRecord | undefined)?.grand_total_credit, NaN) ||
    rows.reduce((acc, row) => acc + row.total_credit, 0)

  return {
    company_id: isRecord(payload) ? toNumberValue(payload.company_id, companyId) : companyId,
    date_from: isRecord(payload)
      ? toStringValue(payload.date_from) || params.dateFrom || null
      : (params.dateFrom ?? null),
    date_to: isRecord(payload)
      ? toStringValue(payload.date_to) || params.dateTo || null
      : (params.dateTo ?? null),
    rows,
    grand_total_debit: Number.isFinite(grandTotalDebit) ? grandTotalDebit : 0,
    grand_total_credit: Number.isFinite(grandTotalCredit) ? grandTotalCredit : 0,
  }
}
