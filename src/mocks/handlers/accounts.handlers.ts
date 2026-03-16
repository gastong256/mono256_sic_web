import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import type { Account } from '@/features/accounts/types/account.types'
import {
  canAccessCompany,
  getAccountChartConfig,
  getCompanyById,
  getRequestUser,
} from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL

// Account ID that will return 409 on delete (has transactions)
const HAS_TRANSACTIONS_ID = 301

let nextAccountId = 400

function makeAccount(
  id: number,
  code: string,
  name: string,
  type: string,
  level: number,
  children: Account[] = []
): Account {
  return {
    id,
    code,
    name,
    type,
    level,
    is_leaf: children.length === 0,
    children,
  }
}

// Global chart (level 0 and 1) — shared across companies
const globalChart: Account[] = [
  makeAccount(1, '1', 'Activo', 'AS', 0, [
    makeAccount(11, '1.01', 'Caja y Bancos', 'AS', 1),
    makeAccount(12, '1.02', 'Créditos', 'AS', 1),
    makeAccount(13, '1.03', 'Bienes de Cambio', 'AS', 1),
    makeAccount(14, '1.04', 'Bienes de Uso', 'AS', 1),
  ]),
  makeAccount(2, '2', 'Pasivo', 'LI', 0, [
    makeAccount(21, '2.01', 'Deudas Comerciales', 'LI', 1),
    makeAccount(22, '2.02', 'Deudas Bancarias', 'LI', 1),
    makeAccount(23, '2.03', 'Deudas Fiscales', 'LI', 1),
  ]),
  makeAccount(3, '3', 'Patrimonio Neto', 'EQ', 0, [
    makeAccount(31, '3.01', 'Capital', 'EQ', 1),
    makeAccount(32, '3.02', 'Resultados', 'EQ', 1),
  ]),
  makeAccount(4, '4', 'Ingresos', 'IN', 0, [
    makeAccount(41, '4.01', 'Ventas', 'IN', 1),
    makeAccount(42, '4.02', 'Otros Ingresos', 'IN', 1),
  ]),
  makeAccount(5, '5', 'Egresos', 'EX', 0, [
    makeAccount(51, '5.01', 'Costo de Ventas', 'EX', 1),
    makeAccount(52, '5.02', 'Gastos Operativos', 'EX', 1),
    makeAccount(53, '5.03', 'Gastos Financieros', 'EX', 1),
  ]),
]

// Per-company movement accounts (level 2) — keyed by companyId
const companyLevel3Accounts: Record<number, Account[]> = {
  1: [
    makeAccount(301, '1.01.01', 'Caja en Pesos', 'AS', 2),
    makeAccount(302, '1.01.02', 'Banco Nación Cta. Cte.', 'AS', 2),
    makeAccount(303, '5.02.01', 'Sueldos y Jornales', 'EX', 2),
  ],
  2: [
    makeAccount(310, '1.01.01', 'Caja en Pesos', 'AS', 2),
    makeAccount(311, '4.01.01', 'Ventas al Contado', 'IN', 2),
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

export function listCompanyMovementAccounts(companyId: number): Account[] {
  return [...(companyLevel3Accounts[companyId] ?? [])]
}

function buildCompanyTree(companyId: number): Account[] {
  const level3 = listCompanyMovementAccounts(companyId)

  return globalChart.map((level0) => {
    const children = (level0.children ?? []).map((level1) => {
      const movementChildren = level3.filter((acc) => accountParents[acc.id] === level1.id)
      return {
        ...level1,
        is_leaf: movementChildren.length === 0,
        children: movementChildren,
      }
    })

    return {
      ...level0,
      is_leaf: children.length === 0,
      children,
    }
  })
}

function applyStudentVisibility(tree: Account[]): Account[] {
  const visibilityByCode = new Map(getAccountChartConfig().map((item) => [item.code, item.visible]))

  function visit(nodes: Account[]): Account[] {
    return nodes.flatMap((node) => {
      if (node.level <= 1 && visibilityByCode.get(node.code) === false) return []
      const children = visit(node.children ?? [])
      return [
        {
          ...node,
          is_leaf: children.length === 0,
          children,
        },
      ]
    })
  }

  return visit(tree)
}

export function resetAccountsMock() {
  nextAccountId = 400
  companyLevel3Accounts[1] = [
    makeAccount(301, '1.01.01', 'Caja en Pesos', 'AS', 2),
    makeAccount(302, '1.01.02', 'Banco Nación Cta. Cte.', 'AS', 2),
    makeAccount(303, '5.02.01', 'Sueldos y Jornales', 'EX', 2),
  ]
  companyLevel3Accounts[2] = [
    makeAccount(310, '1.01.01', 'Caja en Pesos', 'AS', 2),
    makeAccount(311, '4.01.01', 'Ventas al Contado', 'IN', 2),
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
    const user = getRequestUser(request)
    const tree = buildCompanyTree(cId)
    return HttpResponse.json(user?.role === 'student' ? applyStudentVisibility(tree) : tree)
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
      type: 'AS',
      level: 2,
      is_leaf: true,
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
