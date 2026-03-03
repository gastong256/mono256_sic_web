import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import type { Account } from '@/features/accounts/types/account.types'
import { canAccessCompany, getCompanyById, getRequestUser } from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL

// Account ID that will return 409 on delete (has transactions)
const HAS_TRANSACTIONS_ID = 301

let nextAccountId = 400

// Global chart (depth 1 and 2) — shared across companies
const globalChart: Account[] = [
  {
    id: 1,
    code: '1',
    name: 'Activo',
    type: 'asset',
    depth: 1,
    children: [
      { id: 11, code: '1.01', name: 'Caja y Bancos', type: 'asset', depth: 2, children: [] },
      { id: 12, code: '1.02', name: 'Créditos', type: 'asset', depth: 2, children: [] },
      { id: 13, code: '1.03', name: 'Bienes de Cambio', type: 'asset', depth: 2, children: [] },
      { id: 14, code: '1.04', name: 'Bienes de Uso', type: 'asset', depth: 2, children: [] },
    ],
  },
  {
    id: 2,
    code: '2',
    name: 'Pasivo',
    type: 'liability',
    depth: 1,
    children: [
      {
        id: 21,
        code: '2.01',
        name: 'Deudas Comerciales',
        type: 'liability',
        depth: 2,
        children: [],
      },
      { id: 22, code: '2.02', name: 'Deudas Bancarias', type: 'liability', depth: 2, children: [] },
      { id: 23, code: '2.03', name: 'Deudas Fiscales', type: 'liability', depth: 2, children: [] },
    ],
  },
  {
    id: 3,
    code: '3',
    name: 'Patrimonio Neto',
    type: 'equity',
    depth: 1,
    children: [
      { id: 31, code: '3.01', name: 'Capital', type: 'equity', depth: 2, children: [] },
      { id: 32, code: '3.02', name: 'Resultados', type: 'equity', depth: 2, children: [] },
    ],
  },
  {
    id: 4,
    code: '4',
    name: 'Ingresos',
    type: 'revenue',
    depth: 1,
    children: [
      { id: 41, code: '4.01', name: 'Ventas', type: 'revenue', depth: 2, children: [] },
      { id: 42, code: '4.02', name: 'Otros Ingresos', type: 'revenue', depth: 2, children: [] },
    ],
  },
  {
    id: 5,
    code: '5',
    name: 'Egresos',
    type: 'expense',
    depth: 1,
    children: [
      { id: 51, code: '5.01', name: 'Costo de Ventas', type: 'expense', depth: 2, children: [] },
      { id: 52, code: '5.02', name: 'Gastos Operativos', type: 'expense', depth: 2, children: [] },
      { id: 53, code: '5.03', name: 'Gastos Financieros', type: 'expense', depth: 2, children: [] },
    ],
  },
]

// Per-company level-3 accounts — keyed by companyId
const companyLevel3Accounts: Record<number, Account[]> = {
  1: [
    {
      id: 301,
      code: '1.01.01',
      name: 'Caja en Pesos',
      type: 'asset',
      depth: 3,
      children: [],
    },
    {
      id: 302,
      code: '1.01.02',
      name: 'Banco Nación Cta. Cte.',
      type: 'asset',
      depth: 3,
      children: [],
    },
    {
      id: 303,
      code: '5.02.01',
      name: 'Sueldos y Jornales',
      type: 'expense',
      depth: 3,
      children: [],
    },
  ],
  2: [
    {
      id: 310,
      code: '1.01.01',
      name: 'Caja en Pesos',
      type: 'asset',
      depth: 3,
      children: [],
    },
    {
      id: 311,
      code: '4.01.01',
      name: 'Ventas al Contado',
      type: 'revenue',
      depth: 3,
      children: [],
    },
  ],
  3: [],
}

// Parent mapping: level3 account id → parent level2 id
const accountParents: Record<number, number> = {
  301: 11,
  302: 11,
  303: 52,
  310: 11,
  311: 41,
}

function buildCompanyTree(companyId: number): Account[] {
  const level3 = companyLevel3Accounts[companyId] ?? []

  return globalChart.map((level1) => ({
    ...level1,
    children: level1.children?.map((level2) => ({
      ...level2,
      children: level3.filter((acc) => accountParents[acc.id] === level2.id),
    })),
  }))
}

export function resetAccountsMock() {
  nextAccountId = 400
  companyLevel3Accounts[1] = [
    { id: 301, code: '1.01.01', name: 'Caja en Pesos', type: 'asset', depth: 3, children: [] },
    {
      id: 302,
      code: '1.01.02',
      name: 'Banco Nación Cta. Cte.',
      type: 'asset',
      depth: 3,
      children: [],
    },
    {
      id: 303,
      code: '5.02.01',
      name: 'Sueldos y Jornales',
      type: 'expense',
      depth: 3,
      children: [],
    },
  ]
  companyLevel3Accounts[2] = [
    { id: 310, code: '1.01.01', name: 'Caja en Pesos', type: 'asset', depth: 3, children: [] },
    {
      id: 311,
      code: '4.01.01',
      name: 'Ventas al Contado',
      type: 'revenue',
      depth: 3,
      children: [],
    },
  ]
  companyLevel3Accounts[3] = []
}

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  return auth !== null && auth.startsWith('Bearer ')
}

function ensureCompanyAccess(request: Request, companyId: number): Response | null {
  const user = getRequestUser(request)
  if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

  const company = getCompanyById(companyId)
  if (!company) return HttpResponse.json({ detail: 'Company not found.' }, { status: 404 })
  if (!canAccessCompany(user, company)) {
    return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
  }

  return null
}

export const accountsHandlers = [
  // GET /accounts/chart/
  http.get(`${BASE}/accounts/chart/`, async ({ request }) => {
    await delay(100)
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json(globalChart)
  }),

  // GET /accounts/company/:companyId/
  http.get(`${BASE}/accounts/company/:companyId/`, async ({ request, params }) => {
    await delay(150)
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const cId = Number(params.companyId)
    const accessError = ensureCompanyAccess(request, cId)
    if (accessError) return accessError
    return HttpResponse.json(buildCompanyTree(cId))
  }),

  // POST /accounts/company/:companyId/
  http.post(`${BASE}/accounts/company/:companyId/`, async ({ request, params }) => {
    await delay(200)
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const cId = Number(params.companyId)
    const accessError = ensureCompanyAccess(request, cId)
    if (accessError) return accessError
    const body = (await request.json()) as {
      name?: string
      code?: string
      parent_id?: number
    }

    if (!body.name) {
      return HttpResponse.json({ name: ['Este campo es obligatorio.'] }, { status: 400 })
    }
    if (!body.code) {
      return HttpResponse.json({ code: ['Este campo es obligatorio.'] }, { status: 400 })
    }

    const newAccount: Account = {
      id: nextAccountId++,
      code: body.code,
      name: body.name,
      type: 'asset',
      depth: 3,
      children: [],
    }

    if (!companyLevel3Accounts[cId]) {
      companyLevel3Accounts[cId] = []
    }
    companyLevel3Accounts[cId].push(newAccount)

    if (body.parent_id) {
      accountParents[newAccount.id] = body.parent_id
    }

    return HttpResponse.json(newAccount, { status: 201 })
  }),

  // PATCH /accounts/company/:companyId/:accountId/
  http.patch(`${BASE}/accounts/company/:companyId/:accountId/`, async ({ request, params }) => {
    await delay(200)
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const cId = Number(params.companyId)
    const accessError = ensureCompanyAccess(request, cId)
    if (accessError) return accessError
    const aId = Number(params.accountId)
    const list = companyLevel3Accounts[cId] ?? []
    const idx = list.findIndex((a) => a.id === aId)

    if (idx === -1) {
      return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    }

    const body = (await request.json()) as { name?: string; code?: string }
    list[idx] = {
      ...list[idx],
      ...(body.name !== undefined && { name: body.name }),
      ...(body.code !== undefined && { code: body.code }),
    }

    return HttpResponse.json(list[idx])
  }),

  // DELETE /accounts/company/:companyId/:accountId/
  http.delete(`${BASE}/accounts/company/:companyId/:accountId/`, async ({ request, params }) => {
    await delay(200)
    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }
    const cId = Number(params.companyId)
    const accessError = ensureCompanyAccess(request, cId)
    if (accessError) return accessError
    const aId = Number(params.accountId)

    // Simulate 409 for account with transactions
    if (aId === HAS_TRANSACTIONS_ID) {
      return HttpResponse.json(
        {
          detail: 'Esta cuenta tiene movimientos registrados y no puede eliminarse.',
        },
        { status: 409 }
      )
    }

    const list = companyLevel3Accounts[cId] ?? []
    const idx = list.findIndex((a) => a.id === aId)

    if (idx === -1) {
      return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    }

    list.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
