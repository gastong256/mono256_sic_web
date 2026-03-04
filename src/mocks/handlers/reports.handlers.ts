import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  canAccessCompany,
  getAccountChartConfig,
  getCompanyById,
  getRequestUser,
  listJournalEntryDetailsByCompany,
} from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL

function buildMockWorkbookBinary(content: string): Uint8Array {
  return new TextEncoder().encode(content)
}

function buildXlsxDownloadResponse(filename: string, content: string): Response {
  return new HttpResponse<Uint8Array>(buildMockWorkbookBinary(content), {
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

function parseAndValidateReportRequest(request: Request): {
  dateFrom: string | null
  dateTo: string | null
  accountIdRaw: string | null
  accountId: number | null
  badRequestMessage: string | null
} {
  const url = new URL(request.url)
  const dateFrom = url.searchParams.get('date_from')
  const dateTo = url.searchParams.get('date_to')
  const accountIdRaw = url.searchParams.get('account_id')
  const accountId = accountIdRaw && accountIdRaw.trim().length > 0 ? Number(accountIdRaw) : null

  if (dateFrom && dateTo && dateFrom > dateTo) {
    return {
      dateFrom,
      dateTo,
      accountIdRaw,
      accountId,
      badRequestMessage: 'date_from no puede ser mayor a date_to.',
    }
  }
  if (accountIdRaw && (Number.isNaN(accountId) || accountId === null || accountId <= 0)) {
    return {
      dateFrom,
      dateTo,
      accountIdRaw,
      accountId,
      badRequestMessage: 'account_id inválido.',
    }
  }

  return { dateFrom, dateTo, accountIdRaw, accountId, badRequestMessage: null }
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

    const url = new URL(request.url)
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')

    if (dateFrom && dateTo && dateFrom > dateTo) {
      return HttpResponse.json(
        { detail: 'date_from no puede ser mayor a date_to.' },
        { status: 400 }
      )
    }

    const entries = applyDateFilter(listJournalEntryDetailsByCompany(companyId), dateFrom, dateTo)

    const grandTotalDebit = entries.reduce((acc, entry) => acc + entry.total_debit, 0)
    const grandTotalCredit = entries.reduce((acc, entry) => acc + entry.total_credit, 0)

    return HttpResponse.json({
      company_id: companyId,
      date_from: dateFrom,
      date_to: dateTo,
      entries,
      grand_total_debit: grandTotalDebit,
      grand_total_credit: grandTotalCredit,
    })
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

      const { dateFrom, dateTo, badRequestMessage } = parseAndValidateReportRequest(request)
      if (badRequestMessage) {
        return HttpResponse.json({ detail: badRequestMessage }, { status: 400 })
      }

      return buildXlsxDownloadResponse(
        `libro-diario-${companyId}.xlsx`,
        `Mock XLSX - Libro Diario\ncompany_id=${companyId}\ndate_from=${dateFrom ?? ''}\ndate_to=${dateTo ?? ''}`
      )
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

    const url = new URL(request.url)
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')
    const accountIdRaw = url.searchParams.get('account_id')
    const accountId = accountIdRaw && accountIdRaw.trim().length > 0 ? Number(accountIdRaw) : null

    if (dateFrom && dateTo && dateFrom > dateTo) {
      return HttpResponse.json(
        { detail: 'date_from no puede ser mayor a date_to.' },
        { status: 400 }
      )
    }
    if (accountIdRaw && (Number.isNaN(accountId) || accountId === null || accountId <= 0)) {
      return HttpResponse.json({ detail: 'account_id inválido.' }, { status: 400 })
    }

    const entries = applyDateFilter(
      listJournalEntryDetailsByCompany(companyId),
      dateFrom,
      dateTo
    ).sort((a, b) =>
      a.date === b.date ? a.entry_number - b.entry_number : a.date.localeCompare(b.date)
    )

    const cardsMap = new Map<
      number,
      {
        account_id: number
        account_code: string
        account_name: string
        total_debit: number
        total_credit: number
        ending_balance: number
        movements: Array<{
          entry_id: number
          entry_number: number
          date: string
          description: string
          debit: number
          credit: number
          balance: number
        }>
      }
    >()

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        if (accountId !== null && line.account_id !== accountId) return

        const debit = line.type === 'DEBIT' ? Number(line.amount) : 0
        const credit = line.type === 'CREDIT' ? Number(line.amount) : 0
        const card = cardsMap.get(line.account_id) ?? {
          account_id: line.account_id,
          account_code: line.account_code,
          account_name: line.account_name,
          total_debit: 0,
          total_credit: 0,
          ending_balance: 0,
          movements: [],
        }

        card.total_debit += debit
        card.total_credit += credit
        card.ending_balance += debit - credit
        card.movements.push({
          entry_id: entry.id,
          entry_number: entry.entry_number,
          date: entry.date,
          description: entry.description,
          debit,
          credit,
          balance: card.ending_balance,
        })

        cardsMap.set(line.account_id, card)
      })
    })

    const cards = Array.from(cardsMap.values()).sort((a, b) =>
      a.account_code.localeCompare(b.account_code)
    )

    return HttpResponse.json({
      company_id: companyId,
      date_from: dateFrom,
      date_to: dateTo,
      account_id: accountId,
      cards,
    })
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

    const { dateFrom, dateTo, accountId, badRequestMessage } =
      parseAndValidateReportRequest(request)
    if (badRequestMessage) {
      return HttpResponse.json({ detail: badRequestMessage }, { status: 400 })
    }

    return buildXlsxDownloadResponse(
      `libro-mayor-${companyId}.xlsx`,
      `Mock XLSX - Libro Mayor\ncompany_id=${companyId}\ndate_from=${dateFrom ?? ''}\ndate_to=${dateTo ?? ''}\naccount_id=${accountId ?? ''}`
    )
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

    const url = new URL(request.url)
    const dateFrom = url.searchParams.get('date_from')
    const dateTo = url.searchParams.get('date_to')

    if (dateFrom && dateTo && dateFrom > dateTo) {
      return HttpResponse.json(
        { detail: 'date_from no puede ser mayor a date_to.' },
        { status: 400 }
      )
    }

    const entries = applyDateFilter(listJournalEntryDetailsByCompany(companyId), dateFrom, dateTo)
    const accountMap = new Map<
      number,
      {
        account_id: number
        code: string
        name: string
        total_debit: number
        total_credit: number
        balance: number
      }
    >()

    entries.forEach((entry) => {
      entry.lines.forEach((line) => {
        const debit = line.type === 'DEBIT' ? Number(line.amount) : 0
        const credit = line.type === 'CREDIT' ? Number(line.amount) : 0
        const current = accountMap.get(line.account_id) ?? {
          account_id: line.account_id,
          code: line.account_code,
          name: line.account_name,
          total_debit: 0,
          total_credit: 0,
          balance: 0,
        }

        current.total_debit += debit
        current.total_credit += credit
        current.balance = current.total_debit - current.total_credit
        accountMap.set(line.account_id, current)
      })
    })

    const level2Config = getAccountChartConfig().filter((item) => item.level === 2)
    const groupMap = new Map<
      string,
      {
        level2_id: number
        code: string
        name: string
        total_debit: number
        total_credit: number
        balance: number
        accounts: Array<{
          account_id: number
          code: string
          name: string
          total_debit: number
          total_credit: number
          balance: number
        }>
      }
    >()

    Array.from(accountMap.values())
      .sort((a, b) => a.code.localeCompare(b.code))
      .forEach((account) => {
        const parts = account.code.split('.')
        const level2Code = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : account.code
        const level2 = level2Config.find((item) => item.code === level2Code)
        const fallbackLevel2Id = Number(parts.join(''))
        const group = groupMap.get(level2Code) ?? {
          level2_id:
            level2?.account_id ?? (Number.isFinite(fallbackLevel2Id) ? fallbackLevel2Id : 0),
          code: level2Code,
          name: level2?.name ?? `Colectiva ${level2Code}`,
          total_debit: 0,
          total_credit: 0,
          balance: 0,
          accounts: [],
        }

        group.total_debit += account.total_debit
        group.total_credit += account.total_credit
        group.balance = group.total_debit - group.total_credit
        group.accounts.push(account)
        groupMap.set(level2Code, group)
      })

    const rows = Array.from(groupMap.values()).sort((a, b) => a.code.localeCompare(b.code))
    const grandTotalDebit = rows.reduce((acc, row) => acc + row.total_debit, 0)
    const grandTotalCredit = rows.reduce((acc, row) => acc + row.total_credit, 0)

    return HttpResponse.json({
      company_id: companyId,
      date_from: dateFrom,
      date_to: dateTo,
      rows,
      grand_total_debit: grandTotalDebit,
      grand_total_credit: grandTotalCredit,
    })
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

      const { dateFrom, dateTo, badRequestMessage } = parseAndValidateReportRequest(request)
      if (badRequestMessage) {
        return HttpResponse.json({ detail: badRequestMessage }, { status: 400 })
      }

      return buildXlsxDownloadResponse(
        `balance-comprobacion-${companyId}.xlsx`,
        `Mock XLSX - Balance de Comprobacion\ncompany_id=${companyId}\ndate_from=${dateFrom ?? ''}\ndate_to=${dateTo ?? ''}`
      )
    }
  ),
]
