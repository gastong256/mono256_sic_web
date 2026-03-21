import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import type { Account } from '@/features/accounts/types/account.types'
import {
  canAccessCompany,
  getAccountChartConfig,
  getCompanyById,
  getLogicalExercises,
  getRequestUser,
  listJournalEntryDetailsByCompany,
} from '@/mocks/data/mockDb'
import { listCompanyMovementAccounts } from '@/mocks/handlers/accounts.handlers'
import { buildXlsxDownloadResponse } from '@/mocks/handlers/xlsx'

const BASE = env.VITE_API_BASE_URL

function applyDateFilter(
  entries: ReturnType<typeof listJournalEntryDetailsByCompany>,
  dateFrom: string | null,
  dateTo: string | null
) {
  return entries.filter((entry) => {
    if (dateFrom && entry.date < dateFrom) return false
    if (dateTo && entry.date > dateTo) return false
    return true
  })
}

function todayAsIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function isValidIsoDate(value: string | null): boolean {
  if (!value) return true
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

function formatMoney(value: number): string {
  return value.toFixed(2)
}

function getLedgerAccountType(account: Account): string {
  return account.type.toUpperCase().slice(0, 2)
}

function getNormalBalance(account: Account): 'DEBIT' | 'CREDIT' {
  return account.type === 'AS' || account.type === 'EX' ? 'DEBIT' : 'CREDIT'
}

type ReportValidationError = {
  body: Record<string, string> | { detail: string }
  status: number
}

function parseAndValidateReportRequest(request: Request): {
  dateFrom: string | null
  dateTo: string | null
  accountIdRaw: string | null
  accountId: number | null
  validationError: ReportValidationError | null
} {
  const url = new URL(request.url)
  const dateFrom = url.searchParams.get('date_from')
  const dateTo = url.searchParams.get('date_to')
  const accountIdRaw = url.searchParams.get('account_id')
  const accountId = accountIdRaw && accountIdRaw.trim().length > 0 ? Number(accountIdRaw) : null

  if (!isValidIsoDate(dateFrom)) {
    return {
      dateFrom,
      dateTo,
      accountIdRaw,
      accountId,
      validationError: {
        body: { date_from: 'Fecha inválida. Use formato YYYY-MM-DD.' },
        status: 400,
      },
    }
  }
  if (!isValidIsoDate(dateTo)) {
    return {
      dateFrom,
      dateTo,
      accountIdRaw,
      accountId,
      validationError: {
        body: { date_to: 'Fecha inválida. Use formato YYYY-MM-DD.' },
        status: 400,
      },
    }
  }
  if (dateFrom && dateTo && dateFrom > dateTo) {
    return {
      dateFrom,
      dateTo,
      accountIdRaw,
      accountId,
      validationError: { body: { detail: 'date_from no puede ser mayor a date_to.' }, status: 400 },
    }
  }
  if (accountIdRaw && (Number.isNaN(accountId) || accountId === null || accountId <= 0)) {
    return {
      dateFrom,
      dateTo,
      accountIdRaw,
      accountId,
      validationError: { body: { account_id: 'ID de cuenta inválido.' }, status: 400 },
    }
  }

  return { dateFrom, dateTo, accountIdRaw, accountId, validationError: null }
}

function resolveExerciseWindow(
  companyId: number,
  requestedDateFrom: string | null,
  requestedDateTo: string | null
) {
  const logical = getLogicalExercises(companyId)
  const effectiveRequestedTo = requestedDateTo ?? todayAsIsoDate()

  if (!logical || logical.exercises.length === 0) {
    return {
      requestedDateFrom,
      requestedDateTo: effectiveRequestedTo,
      activeExercise: null,
      previousExercises: [],
      visibleDateFrom: requestedDateFrom,
      visibleDateTo: effectiveRequestedTo,
      exerciseStartDate: requestedDateFrom,
    }
  }

  const intersected = logical.exercises.filter((exercise) => {
    const exerciseEnd = exercise.closing_date ?? effectiveRequestedTo
    if (requestedDateFrom === null) return exercise.start_date <= effectiveRequestedTo
    return exercise.start_date <= effectiveRequestedTo && exerciseEnd >= requestedDateFrom
  })

  const activeExercise =
    intersected.at(-1) ??
    logical.exercises.find((exercise) => exercise.exercise_id === logical.current_exercise_id) ??
    logical.exercises.at(-1) ??
    null

  const previousExercises =
    activeExercise === null
      ? []
      : logical.exercises.filter(
          (exercise) => exercise.exercise_index < activeExercise.exercise_index
        )

  const visibleDateTo =
    activeExercise?.closing_date && activeExercise.closing_date < effectiveRequestedTo
      ? activeExercise.closing_date
      : effectiveRequestedTo
  const visibleDateFrom =
    activeExercise === null
      ? requestedDateFrom
      : requestedDateFrom && requestedDateFrom > activeExercise.start_date
        ? requestedDateFrom
        : activeExercise.start_date

  return {
    requestedDateFrom,
    requestedDateTo: effectiveRequestedTo,
    activeExercise,
    previousExercises,
    visibleDateFrom,
    visibleDateTo,
    exerciseStartDate: activeExercise?.start_date ?? visibleDateFrom,
  }
}

function buildLedgerPayload(
  companyId: number,
  companyName: string,
  rawDateFrom: string | null,
  rawDateTo: string | null,
  accountId: number | null,
  includeAccountOptions: boolean
) {
  const exerciseWindow = resolveExerciseWindow(companyId, rawDateFrom, rawDateTo)
  const movementAccounts = listCompanyMovementAccounts(companyId).sort((a, b) =>
    a.code.localeCompare(b.code)
  )
  const accountById = new Map(movementAccounts.map((account) => [account.id, account]))

  if (accountId !== null && !accountById.has(accountId)) {
    return {
      error: HttpResponse.json({ account_id: 'ID de cuenta inválido.' }, { status: 400 }),
    }
  }

  const effectiveDateTo = exerciseWindow.visibleDateTo ?? todayAsIsoDate()
  const selectedAccounts =
    accountId === null
      ? movementAccounts
      : movementAccounts.filter((account) => account.id === accountId)

  const entriesUntilDateTo = applyDateFilter(
    listJournalEntryDetailsByCompany(companyId),
    exerciseWindow.exerciseStartDate,
    effectiveDateTo
  ).sort((a, b) =>
    a.date === b.date ? a.entry_number - b.entry_number : a.date.localeCompare(b.date)
  )

  const accounts = selectedAccounts.map((account) => {
    const normalBalance = getNormalBalance(account)
    const signedAmount = (debit: number, credit: number) =>
      normalBalance === 'DEBIT' ? debit - credit : credit - debit

    let openingBalance = 0
    const movements: Array<{
      date: string
      entry_number: number
      description: string
      source_ref: string
      debit: string | null
      credit: string | null
      balance: string
    }> = []
    let totalDebit = 0
    let totalCredit = 0
    let runningBalance = 0

    entriesUntilDateTo.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (line.account_id !== account.id) return

        const debit = line.type === 'DEBIT' ? Number(line.amount) : 0
        const credit = line.type === 'CREDIT' ? Number(line.amount) : 0

        if (exerciseWindow.visibleDateFrom && entry.date < exerciseWindow.visibleDateFrom) {
          openingBalance += signedAmount(debit, credit)
          return
        }

        totalDebit += debit
        totalCredit += credit
        runningBalance += signedAmount(debit, credit)
        movements.push({
          date: entry.date,
          entry_number: entry.entry_number,
          description: entry.description,
          source_ref: entry.source_ref,
          debit: debit > 0 ? formatMoney(debit) : null,
          credit: credit > 0 ? formatMoney(credit) : null,
          balance: formatMoney(openingBalance + runningBalance),
        })
      })
    })

    const closingBalance = openingBalance + runningBalance

    return {
      account_code: account.code,
      account_name: account.name,
      account_type: getLedgerAccountType(account),
      normal_balance: normalBalance,
      opening_balance: formatMoney(openingBalance),
      movements,
      period_totals: {
        total_debit: formatMoney(totalDebit),
        total_credit: formatMoney(totalCredit),
      },
      closing_balance: formatMoney(closingBalance),
    }
  })

  const effectiveDateFrom =
    exerciseWindow.visibleDateFrom ??
    (() => {
      const selectedAccountIds = new Set(selectedAccounts.map((account) => account.id))
      const firstMovementDate = entriesUntilDateTo.find((entry) =>
        entry.lines.some((line) => selectedAccountIds.has(line.account_id))
      )?.date
      return firstMovementDate ?? effectiveDateTo
    })()

  const payload = {
    company_id: companyId,
    company: companyName,
    date_from: effectiveDateFrom,
    date_to: effectiveDateTo,
    requested_date_from: rawDateFrom,
    requested_date_to: exerciseWindow.requestedDateTo,
    active_exercise: exerciseWindow.activeExercise,
    previous_exercises: exerciseWindow.previousExercises,
    account_id: accountId,
    accounts,
    ...(includeAccountOptions
      ? {
          account_options: movementAccounts.map((account) => ({
            id: account.id,
            code: account.code,
            name: account.name,
          })),
        }
      : null),
  }

  return { payload }
}

function buildJournalBookPayload(
  companyId: number,
  companyName: string,
  dateFrom: string | null,
  dateTo: string | null
) {
  const exerciseWindow = resolveExerciseWindow(companyId, dateFrom, dateTo)
  const entries = applyDateFilter(
    listJournalEntryDetailsByCompany(companyId),
    exerciseWindow.visibleDateFrom,
    exerciseWindow.visibleDateTo
  )
    .sort((a, b) =>
      a.date === b.date ? a.entry_number - b.entry_number : a.date.localeCompare(b.date)
    )
    .map((entry) => ({
      entry_number: entry.entry_number,
      date: entry.date,
      description: entry.description,
      source_type: entry.source_type,
      source_ref: entry.source_ref,
      lines: entry.lines.map((line) => ({
        account_code: line.account_code,
        account_name: line.account_name,
        debit: line.type === 'DEBIT' ? formatMoney(Number(line.amount)) : null,
        credit: line.type === 'CREDIT' ? formatMoney(Number(line.amount)) : null,
      })),
      total_debit: formatMoney(entry.total_debit),
      total_credit: formatMoney(entry.total_credit),
    }))

  const grandTotalDebit = entries.reduce((acc, entry) => acc + Number(entry.total_debit), 0)
  const grandTotalCredit = entries.reduce((acc, entry) => acc + Number(entry.total_credit), 0)

  return {
    company_id: companyId,
    company: companyName,
    date_from: exerciseWindow.visibleDateFrom,
    date_to: exerciseWindow.visibleDateTo,
    requested_date_from: dateFrom,
    requested_date_to: exerciseWindow.requestedDateTo,
    active_exercise: exerciseWindow.activeExercise,
    previous_exercises: exerciseWindow.previousExercises,
    entries,
    grand_total_debit: formatMoney(grandTotalDebit),
    grand_total_credit: formatMoney(grandTotalCredit),
    totals: {
      total_debit: formatMoney(grandTotalDebit),
      total_credit: formatMoney(grandTotalCredit),
    },
  }
}

function buildTrialBalancePayload(
  companyId: number,
  companyName: string,
  dateFrom: string | null,
  dateTo: string | null
) {
  const exerciseWindow = resolveExerciseWindow(companyId, dateFrom, dateTo)
  const entries = applyDateFilter(
    listJournalEntryDetailsByCompany(companyId),
    exerciseWindow.exerciseStartDate,
    exerciseWindow.visibleDateTo
  )
  const movementAccounts = new Map(
    listCompanyMovementAccounts(companyId).map((account) => [account.id, account])
  )
  const collectiveConfig = getAccountChartConfig().filter((item) => item.level === 1)
  const accountMap = new Map<
    number,
    {
      account_code: string
      account_name: string
      account_type: string
      total_debit: number
      total_credit: number
    }
  >()

  entries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const debit = line.type === 'DEBIT' ? Number(line.amount) : 0
      const credit = line.type === 'CREDIT' ? Number(line.amount) : 0
      const movementAccount = movementAccounts.get(line.account_id)
      const current = accountMap.get(line.account_id) ?? {
        account_code: line.account_code,
        account_name: line.account_name,
        account_type: movementAccount ? getLedgerAccountType(movementAccount) : '',
        total_debit: 0,
        total_credit: 0,
      }

      current.total_debit += debit
      current.total_credit += credit
      accountMap.set(line.account_id, current)
    })
  })

  const groupMap = new Map<
    string,
    {
      account_code: string
      account_name: string
      account_type: string
      subtotal_debit: number
      subtotal_credit: number
      accounts: Array<{
        account_code: string
        account_name: string
        account_type: string
        total_debit: number
        total_credit: number
        debit_balance: number | null
        credit_balance: number | null
      }>
    }
  >()

  Array.from(accountMap.values())
    .sort((a, b) => a.account_code.localeCompare(b.account_code))
    .forEach((account) => {
      const parts = account.account_code.split('.')
      const groupCode = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : account.account_code
      const groupConfig = collectiveConfig.find((item) => item.code === groupCode)
      const balance = account.total_debit - account.total_credit
      const currentGroup = groupMap.get(groupCode) ?? {
        account_code: groupCode,
        account_name: groupConfig?.name ?? `Colectiva ${groupCode}`,
        account_type: groupConfig?.code ? account.account_type : account.account_type,
        subtotal_debit: 0,
        subtotal_credit: 0,
        accounts: [],
      }

      currentGroup.subtotal_debit += account.total_debit
      currentGroup.subtotal_credit += account.total_credit
      currentGroup.accounts.push({
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        total_debit: account.total_debit,
        total_credit: account.total_credit,
        debit_balance: balance > 0 ? balance : null,
        credit_balance: balance < 0 ? Math.abs(balance) : null,
      })

      groupMap.set(groupCode, currentGroup)
    })

  const groups = Array.from(groupMap.values())
    .sort((a, b) => a.account_code.localeCompare(b.account_code))
    .map((group) => {
      const balance = group.subtotal_debit - group.subtotal_credit
      return {
        account_code: group.account_code,
        account_name: group.account_name,
        account_type: group.account_type,
        subtotal_debit: formatMoney(group.subtotal_debit),
        subtotal_credit: formatMoney(group.subtotal_credit),
        subtotal_debit_balance: balance > 0 ? formatMoney(balance) : null,
        subtotal_credit_balance: balance < 0 ? formatMoney(Math.abs(balance)) : null,
        accounts: group.accounts.map((account) => ({
          ...account,
          total_debit: formatMoney(account.total_debit),
          total_credit: formatMoney(account.total_credit),
          debit_balance: account.debit_balance === null ? null : formatMoney(account.debit_balance),
          credit_balance:
            account.credit_balance === null ? null : formatMoney(account.credit_balance),
        })),
      }
    })

  const grandTotalDebit = groups.reduce((acc, row) => acc + Number(row.subtotal_debit), 0)
  const grandTotalCredit = groups.reduce((acc, row) => acc + Number(row.subtotal_credit), 0)
  const totalDebitBalance = groups.reduce(
    (acc, row) => acc + (row.subtotal_debit_balance ? Number(row.subtotal_debit_balance) : 0),
    0
  )
  const totalCreditBalance = groups.reduce(
    (acc, row) => acc + (row.subtotal_credit_balance ? Number(row.subtotal_credit_balance) : 0),
    0
  )

  return {
    company_id: companyId,
    company: companyName,
    date_from: exerciseWindow.exerciseStartDate,
    date_to: exerciseWindow.visibleDateTo,
    requested_date_from: dateFrom,
    requested_date_to: exerciseWindow.requestedDateTo,
    active_exercise: exerciseWindow.activeExercise,
    previous_exercises: exerciseWindow.previousExercises,
    groups,
    grand_total_debit: formatMoney(grandTotalDebit),
    grand_total_credit: formatMoney(grandTotalCredit),
    totals: {
      total_debit: formatMoney(grandTotalDebit),
      total_credit: formatMoney(grandTotalCredit),
      total_debit_balance: formatMoney(totalDebitBalance),
      total_credit_balance: formatMoney(totalCreditBalance),
    },
  }
}

export const reportsHandlers = [
  http.get(`${BASE}/companies/:companyId/reports/journal-book/`, async ({ request, params }) => {
    await delay(160)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.companyId)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
    if (!canAccessCompany(user, company)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }
    if (company.accounting_ready === false) {
      return HttpResponse.json(
        {
          detail:
            'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
        },
        { status: 409 }
      )
    }

    const { dateFrom, dateTo, validationError } = parseAndValidateReportRequest(request)
    if (validationError) {
      return HttpResponse.json(validationError.body, { status: validationError.status })
    }

    return HttpResponse.json(buildJournalBookPayload(companyId, company.name, dateFrom, dateTo))
  }),

  http.get(
    `${BASE}/companies/:companyId/reports/journal-book.xlsx`,
    async ({ request, params }) => {
      await delay(200)

      const user = getRequestUser(request)
      if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

      const companyId = Number(params.companyId)
      const company = getCompanyById(companyId)
      if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
      if (!canAccessCompany(user, company)) {
        return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
      }
      if (company.accounting_ready === false) {
        return HttpResponse.json(
          {
            detail:
              'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
          },
          { status: 409 }
        )
      }

      const { validationError } = parseAndValidateReportRequest(request)
      if (validationError) {
        return HttpResponse.json(validationError.body, { status: validationError.status })
      }

      return buildXlsxDownloadResponse(`libro-diario-${companyId}.xlsx`)
    }
  ),

  http.get(`${BASE}/companies/:companyId/reports/ledger/`, async ({ request, params }) => {
    await delay(170)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.companyId)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
    if (!canAccessCompany(user, company)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }
    if (company.accounting_ready === false) {
      return HttpResponse.json(
        {
          detail:
            'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
        },
        { status: 409 }
      )
    }

    const { dateFrom, dateTo, accountId, validationError } = parseAndValidateReportRequest(request)
    if (validationError) {
      return HttpResponse.json(validationError.body, { status: validationError.status })
    }

    const include = new URL(request.url).searchParams.get('include') ?? ''
    const report = buildLedgerPayload(
      companyId,
      company.name,
      dateFrom,
      dateTo,
      accountId,
      include
        .split(',')
        .map((value) => value.trim())
        .includes('account_options')
    )
    if ('error' in report) return report.error

    return HttpResponse.json(report.payload)
  }),

  http.get(`${BASE}/companies/:companyId/reports/ledger.xlsx`, async ({ request, params }) => {
    await delay(200)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.companyId)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
    if (!canAccessCompany(user, company)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }
    if (company.accounting_ready === false) {
      return HttpResponse.json(
        {
          detail:
            'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
        },
        { status: 409 }
      )
    }

    const { dateFrom, dateTo, accountId, validationError } = parseAndValidateReportRequest(request)
    if (validationError) {
      return HttpResponse.json(validationError.body, { status: validationError.status })
    }

    const report = buildLedgerPayload(companyId, company.name, dateFrom, dateTo, accountId, false)
    if ('error' in report) {
      return report.error
    }

    return buildXlsxDownloadResponse(`libro-mayor-${companyId}.xlsx`)
  }),

  http.get(`${BASE}/companies/:companyId/reports/trial-balance/`, async ({ request, params }) => {
    await delay(170)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.companyId)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
    if (!canAccessCompany(user, company)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }
    if (company.accounting_ready === false) {
      return HttpResponse.json(
        {
          detail:
            'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
        },
        { status: 409 }
      )
    }

    const { dateFrom, dateTo, validationError } = parseAndValidateReportRequest(request)
    if (validationError) {
      return HttpResponse.json(validationError.body, { status: validationError.status })
    }

    return HttpResponse.json(buildTrialBalancePayload(companyId, company.name, dateFrom, dateTo))
  }),

  http.get(
    `${BASE}/companies/:companyId/reports/trial-balance.xlsx`,
    async ({ request, params }) => {
      await delay(200)

      const user = getRequestUser(request)
      if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

      const companyId = Number(params.companyId)
      const company = getCompanyById(companyId)
      if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
      if (!canAccessCompany(user, company)) {
        return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
      }
      if (company.accounting_ready === false) {
        return HttpResponse.json(
          {
            detail:
              'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
          },
          { status: 409 }
        )
      }

      const { validationError } = parseAndValidateReportRequest(request)
      if (validationError) {
        return HttpResponse.json(validationError.body, { status: validationError.status })
      }

      return buildXlsxDownloadResponse(`balance-comprobacion-${companyId}.xlsx`)
    }
  ),
]
