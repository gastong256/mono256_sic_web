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

const MINIMAL_XLSX_BASE64 =
  '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'

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

      const { badRequestMessage } = parseAndValidateReportRequest(request)
      if (badRequestMessage) {
        return HttpResponse.json({ detail: badRequestMessage }, { status: 400 })
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

    const { badRequestMessage } = parseAndValidateReportRequest(request)
    if (badRequestMessage) {
      return HttpResponse.json({ detail: badRequestMessage }, { status: 400 })
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

      const { badRequestMessage } = parseAndValidateReportRequest(request)
      if (badRequestMessage) {
        return HttpResponse.json({ detail: badRequestMessage }, { status: 400 })
      }

      return buildXlsxDownloadResponse(`balance-comprobacion-${companyId}.xlsx`)
    }
  ),
]
