import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import type {
  JournalEntry,
  JournalEntryDetail,
  JournalLine,
  CreateJournalEntryPayload,
} from '@/features/journal/types/journal.types'

const BASE = env.VITE_API_BASE_URL

let nextEntryId = 10

const mockEntries: JournalEntryDetail[] = [
  {
    id: 1,
    entry_number: 1,
    date: '2024-03-01',
    description: 'Depósito inicial en cuenta bancaria',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'admin',
    total_debit: 50000,
    total_credit: 50000,
    lines: [
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'DEBIT',
        amount: '50000.00',
      },
      {
        account_id: 302,
        account_code: '1.01.02',
        account_name: 'Banco Nación Cta. Cte.',
        type: 'CREDIT',
        amount: '50000.00',
      },
    ],
  },
  {
    id: 2,
    entry_number: 2,
    date: '2024-03-15',
    description: 'Pago de sueldos de marzo',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'admin',
    total_debit: 120000,
    total_credit: 120000,
    lines: [
      {
        account_id: 303,
        account_code: '5.02.01',
        account_name: 'Sueldos y Jornales',
        type: 'DEBIT',
        amount: '120000.00',
      },
      {
        account_id: 301,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'CREDIT',
        amount: '120000.00',
      },
    ],
  },
  {
    id: 3,
    entry_number: 1,
    date: '2024-03-10',
    description: 'Venta al contado',
    source_type: 'MANUAL',
    source_ref: '',
    created_by: 'admin',
    total_debit: 30000,
    total_credit: 30000,
    lines: [
      {
        account_id: 310,
        account_code: '1.01.01',
        account_name: 'Caja en Pesos',
        type: 'DEBIT',
        amount: '30000.00',
      },
      {
        account_id: 311,
        account_code: '4.01.01',
        account_name: 'Ventas',
        type: 'CREDIT',
        amount: '30000.00',
      },
    ],
  },
]

const entryCompanyMap: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
}

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  return auth !== null && auth.startsWith('Bearer ')
}

function toListEntry(entry: JournalEntryDetail): JournalEntry {
  const { lines: _lines, ...listEntry } = entry
  return listEntry
}

function resolveAccountName(accountId: number): { code: string; name: string } {
  switch (accountId) {
    case 301:
      return { code: '1.01.01', name: 'Caja en Pesos' }
    case 302:
      return { code: '1.01.02', name: 'Banco Nación Cta. Cte.' }
    case 303:
      return { code: '5.02.01', name: 'Sueldos y Jornales' }
    case 310:
      return { code: '1.01.01', name: 'Caja en Pesos' }
    case 311:
      return { code: '4.01.01', name: 'Ventas al Contado' }
    default:
      return { code: String(accountId), name: `Cuenta ${accountId}` }
  }
}

function summarize(lines: JournalLine[]): { totalDebit: number; totalCredit: number } {
  return lines.reduce(
    (acc, line) => {
      const amount = Number(line.amount)
      if (line.type === 'DEBIT') acc.totalDebit += amount
      if (line.type === 'CREDIT') acc.totalCredit += amount
      return acc
    },
    { totalDebit: 0, totalCredit: 0 }
  )
}

export const journalHandlers = [
  // GET /companies/:companyId/journal/
  http.get(`${BASE}/companies/:companyId/journal/`, async ({ request, params }) => {
    await delay(150)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const companyId = Number(params.companyId)
    const results = mockEntries
      .filter((e) => entryCompanyMap[e.id] === companyId)
      .sort((a, b) => a.entry_number - b.entry_number)
      .map(toListEntry)

    return HttpResponse.json(results)
  }),

  // GET /companies/:companyId/journal/:entryId/
  http.get(`${BASE}/companies/:companyId/journal/:entryId/`, async ({ request, params }) => {
    await delay(100)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const companyId = Number(params.companyId)
    const entry = mockEntries.find(
      (e) => entryCompanyMap[e.id] === companyId && e.id === Number(params.entryId)
    )

    if (!entry) {
      return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    }

    return HttpResponse.json(entry)
  }),

  // POST /companies/:companyId/journal/
  http.post(`${BASE}/companies/:companyId/journal/`, async ({ request, params }) => {
    await delay(250)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CreateJournalEntryPayload
    const companyId = Number(params.companyId)

    if (!body.date) {
      return HttpResponse.json({ date: ['Este campo es obligatorio.'] }, { status: 400 })
    }
    if (!body.description) {
      return HttpResponse.json({ description: ['Este campo es obligatorio.'] }, { status: 400 })
    }
    if (!body.lines || body.lines.length < 2) {
      return HttpResponse.json({ lines: ['Se requieren al menos 2 líneas.'] }, { status: 400 })
    }

    const lines: JournalLine[] = body.lines.map((line) => {
      const account = resolveAccountName(line.account_id)
      return {
        account_id: line.account_id,
        account_code: account.code,
        account_name: account.name,
        type: line.type,
        amount: line.amount,
      }
    })

    const { totalDebit, totalCredit } = summarize(lines)

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return HttpResponse.json({ detail: 'El asiento debe estar balanceado.' }, { status: 400 })
    }

    const maxEntryNumber = Math.max(
      0,
      ...mockEntries
        .filter((entry) => entryCompanyMap[entry.id] === companyId)
        .map((entry) => entry.entry_number)
    )

    const newEntry: JournalEntryDetail = {
      id: nextEntryId++,
      entry_number: maxEntryNumber + 1,
      date: body.date,
      description: body.description,
      source_type: 'MANUAL',
      source_ref: '',
      created_by: 'admin',
      total_debit: totalDebit,
      total_credit: totalCredit,
      lines,
    }

    mockEntries.push(newEntry)
    entryCompanyMap[newEntry.id] = companyId

    return HttpResponse.json(newEntry, { status: 201 })
  }),
]
