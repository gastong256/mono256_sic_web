import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import type { Account } from '@/features/accounts/types/account.types'
import {
  canAccessCompany,
  getAccountChartConfig,
  getCompanyById,
  getRequestUser,
  listJournalEntryDetailsByCompany,
} from '@/mocks/data/mockDb'
import { listCompanyMovementAccounts } from '@/mocks/handlers/accounts.handlers'

const BASE = env.VITE_API_BASE_URL

const MINIMAL_XLSX_BASE64 =
  'UEsDBBQAAAAIAJcMZFz0OHCKMAEAAKwDAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbK1TS28CIRC++ysIV7OgPTRNs6uHPo6tB/sDKMy6ZFkgDFr9951d+0garTb1RMj3ZDKU823n2AYS2uArPhUTzsDrYKxfVfxl+VjccIZZeaNc8FDxHSCfz0blchcBGYk9VrzJOd5KibqBTqEIETwhdUidynRNKxmVbtUK5NVkci118Bl8LnLvwWcjxsp7qNXaZfawJWTfJYFDzu723D6u4ipGZ7XKhMuNNz+Cio8QQcqBg42NOCYCl8dCevB4xrf0mUaUrAG2UCk/qY6IcuvkW0jtawit+N3nQNdQ11aDCXrdkURgTKAMNgC5c2I4RaesH59VYeCjHI7phbt8+Z+ugnnnAC89i8H0RDhpFylEpNVK8PcCn4vTq4tIRpCyPT+U3P/9aOh30oA5EF/K4bPN3gFQSwMEFAAAAAgAlwxkXE9jwrHsAAAAVQIAAAsAAABfcmVscy8ucmVsc62SzU7DMAyA73uKyPc13SYhhJruMiHtNqHxACZxf9Q2jhID3dsTIYEYYrADxzj258+Wq+08jeqFYurZG1gVJSjyll3vWwOPx/vlLagk6B2O7MnAiRJs60X1QCNKrkldH5LKEJ8MdCLhTutkO5owFRzI55+G44SSn7HVAe2ALel1Wd7o+JUB9UKpM6zaOwNx71agjqdA1+C5aXpLO7bPE3n5ocu3jEzG2JIYmEf9ynF4Yh6KDAV9UWd9vc7lafVEgg4FteVIyxBzdZQ+L/fTyLE95HB6z/jDafOfK6JZyDtyv1thCB9SlT67hvoNUEsDBBQAAAAIAJcMZFyItw7nrwAAABoBAAAQAAAAZG9jUHJvcHMvYXBwLnhtbJ3PvQoCMRAE4P6eIqTXnBYikjsRRbAT/OlDsncGLrshWUXf3oig1pa7Ax8zenkPg7hByp6wkZNxLQWgJeexb+TpuB3Npchs0JmBEBr5gCyXbaX3iSIk9pBFETA38sIcF0ple4Fg8rjEWJKOUjBcztQr6jpvYUP2GgBZTet6puDOgA7cKH5A+RYXN/4XdWRf/fL5+IjFaysh9CrGwVvDZWd72K3FBgJp9futtPquap9QSwMEFAAAAAgAlwxkXNwW32f7AAAAwwEAABEAAABkb2NQcm9wcy9jb3JlLnhtbG2Q3UrEMBBG7/sUIfftbBVEStuFVQTBBWEVvA3JbDfY/JCMdvv2pkVrxb2c+U4Ok6/enk3PPjFE7WzDy2LDGVrplLZdw19fHvJbziIJq0TvLDZ8xMi3bVZLX0kX8Dk4j4E0RpZENlbSN/xE5CuAKE9oRCwSYVN4dMEISmPowAv5LjqEq83mBgySUIIETMLcL0b+rVRyUfqP0M8CJQF7NGgpQlmU8MsSBhMvPpiTFWk0jR4voj/hQp+jXsBhGIrhekbT/SW87Z8O81dzbaeqJPI2Y6xWspIBBbnQHh7v2D0aV8NqOTGpxl5E2qfCjxrVblyh/7NsXv7tvf0CUEsDBBQAAAAIAJcMZFx/h7qTwgAAACkBAAAPAAAAeGwvd29ya2Jvb2sueG1sjU9BjsIwDLzzish3SOGAVlVbLgiJK9p9QGhcGtHYkR1Y9vcbQL1zm/FoxjPN7hEnc0fRwNTCelWBQerZB7q08PN9WH6B0ezIu4kJW/hDhV23aH5Zrmfmqyl+0hbGnFNtrfYjRqcrTkhFGViiy4XKxWoSdF5HxBwnu6mqrY0uELwTavkkg4ch9Ljn/haR8jtEcHK5tNcxJIVuYUzzeqJPOBNDLpb2J0wsGcuk5/Hoy2IwUocC5OjXYF92O/sbO8/s/gFQSwMEFAAAAAgAlwxkXDnTHjzKAAAArwEAABoAAAB4bC9fcmVscy93b3JrYm9vay54bWwucmVsc62QTYvCQAyG7/6KIXeb1oPI0qkXEbyK+wOGafqB7cwwiR/99zsoygoKe9hTeBPy5CHl+joO6kyRe+80FFkOipz1de9aDd+H7XwFisW42gzekYaJGNbVrNzTYCTtcNcHVgniWEMnEr4Q2XY0Gs58IJcmjY+jkRRji8HYo2kJF3m+xPibAdVMqRes2tUa4q4uQB2mQH/B+6bpLW28PY3k5M0VvPh45I5IEtTElkTDs8V4K0WWqIAffRb/6cMyDemlT5l7fhiU+PLn6gdQSwMEFAAAAAgAlwxkXLVI72ATAQAABwIAAA0AAAB4bC9zdHlsZXMueG1sZZGxbsMgEIb3PAW6vcHpUFWVTYZIkbp0SSp1xfY5RoLDAhLZffqCSd1YnfD9990nc5T70Wh2Q+eVpQp22wIYUmNbRZcKPs/Hp1dgPkhqpbaEFUzoYS82pQ+TxlOPGFg0kK+gD2F449w3PRrpt3ZAip3OOiNDLN2F+8GhbH0aMpo/F8ULN1IRiA1jZWcpeNbYK4X4HyDmQJT+m92kjskOuChJGsz1QWpVO5VCnsn58NmltF67YiDKQYaAjo6xYPfv8zTES1G8WjbN3HxkU21dG5fz6MpRou/NGWxQ61PayVe3oscukY/dBf9HsrF7byso4HfkkZ7HVwNLytJaKvhIq9awWFh9VTooWjuzJ74g/3tC8QNQSwMEFAAAAAgAlwxkXG0OcwbgAAAAXQEAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0MS54bWx1kEFrwzAMhe/9FUKn7bA6zWGM4biUdYOdu/0A46iNqW0FW6TZv5/TQ9lgOwj03kMfD+ntHANMlIvn1OFm3SBQctz7dOrw8+Pt4QmhiE29DZyowy8quDUrfeF8LgORQAWk0uEgMj4rVdxA0ZY1j5RqcuQcrVSZT6qMmWx/PYpBtU3zqKL1Cc0KQF/tvRW7qKozXyDXQmi0W5bdBkE69Cn4RAfJ1ffFaDGH9xfYU2R4nUfOopUYrZZIuToV8xvY3oDtP8BddoOfGCK7M0w2+J7hbj2HMt//DdfqR3mtbp8x31BLAQIUAxQAAAAIAJcMZFz0OHCKMAEAAKwDAAATAAAAAAAAAAAAAACAAQAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQDFAAAAAgAlwxkXE9jwrHsAAAAVQIAAAsAAAAAAAAAAAAAAIABYQEAAF9yZWxzLy5yZWxzUEsBAhQDFAAAAAgAlwxkXIi3DuevAAAAGgEAABAAAAAAAAAAAAAAAIABdgIAAGRvY1Byb3BzL2FwcC54bWxQSwECFAMUAAAACACXDGRc3BbfZ/sAAADDAQAAEQAAAAAAAAAAAAAAgAFTAwAAZG9jUHJvcHMvY29yZS54bWxQSwECFAMUAAAACACXDGRcf4e6k8IAAAApAQAADwAAAAAAAAAAAAAAgAF9BAAAeGwvd29ya2Jvb2sueG1sUEsBAhQDFAAAAAgAlwxkXDnTHjzKAAAArwEAABoAAAAAAAAAAAAAAIABbAUAAHhsL19yZWxzL3dvcmtib29rLnhtbC5yZWxzUEsBAhQDFAAAAAgAlwxkXLVI72ATAQAABwIAAA0AAAAAAAAAAAAAAIABbgYAAHhsL3N0eWxlcy54bWxQSwECFAMUAAAACACXDGRcbQ5zBuAAAABdAQAAGAAAAAAAAAAAAAAAgAGsBwAAeGwvd29ya3NoZWV0cy9zaGVldDEueG1sUEsFBgAAAAAIAAgA/QEAAMIIAAAAAA=='

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const MINIMAL_XLSX_BYTES = decodeBase64ToUint8Array(MINIMAL_XLSX_BASE64)

function buildXlsxDownloadResponse(filename: string): Response {
  return new HttpResponse<Uint8Array>(MINIMAL_XLSX_BYTES, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

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

function buildLedgerPayload(
  companyId: number,
  companyName: string,
  rawDateFrom: string | null,
  rawDateTo: string | null,
  accountId: number | null,
  includeAccountOptions: boolean
) {
  const movementAccounts = listCompanyMovementAccounts(companyId).sort((a, b) =>
    a.code.localeCompare(b.code)
  )
  const accountById = new Map(movementAccounts.map((account) => [account.id, account]))

  if (accountId !== null && !accountById.has(accountId)) {
    return {
      error: HttpResponse.json({ account_id: 'ID de cuenta inválido.' }, { status: 400 }),
    }
  }

  const effectiveDateTo = rawDateTo ?? todayAsIsoDate()
  const selectedAccounts =
    accountId === null
      ? movementAccounts
      : movementAccounts.filter((account) => account.id === accountId)

  const entriesUntilDateTo = applyDateFilter(
    listJournalEntryDetailsByCompany(companyId),
    null,
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

        if (rawDateFrom && entry.date < rawDateFrom) {
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
    rawDateFrom ??
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
  const entries = applyDateFilter(listJournalEntryDetailsByCompany(companyId), dateFrom, dateTo)
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
    date_from: dateFrom,
    date_to: dateTo,
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
  const entries = applyDateFilter(listJournalEntryDetailsByCompany(companyId), dateFrom, dateTo)
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
    date_from: dateFrom,
    date_to: dateTo,
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

      const { validationError } = parseAndValidateReportRequest(request)
      if (validationError) {
        return HttpResponse.json(validationError.body, { status: validationError.status })
      }

      return buildXlsxDownloadResponse(`balance-comprobacion-${companyId}.xlsx`)
    }
  ),
]
