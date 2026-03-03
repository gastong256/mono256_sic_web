import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import type { Company } from '@/features/companies/types/company.types'

const BASE = env.VITE_API_BASE_URL

let nextId = 4

let mockCompanies: Company[] = [
  {
    id: 1,
    name: 'Ferretería Los Andes',
    tax_id: '20-12345678-9',
    owner_username: 'admin',
    account_count: 3,
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2024-03-01T10:00:00Z',
  },
  {
    id: 2,
    name: 'Librería del Centro',
    tax_id: null,
    owner_username: 'admin',
    account_count: 2,
    created_at: '2024-03-15T14:30:00Z',
    updated_at: '2024-03-15T14:30:00Z',
  },
  {
    id: 3,
    name: 'Panadería San Martín',
    tax_id: '27-98765432-1',
    owner_username: 'student1',
    account_count: 0,
    created_at: '2024-04-01T09:00:00Z',
    updated_at: '2024-04-01T09:00:00Z',
  },
]

export function resetCompaniesMock() {
  nextId = 4
  mockCompanies = [
    {
      id: 1,
      name: 'Ferretería Los Andes',
      tax_id: '20-12345678-9',
      owner_username: 'admin',
      account_count: 3,
      created_at: '2024-03-01T10:00:00Z',
      updated_at: '2024-03-01T10:00:00Z',
    },
    {
      id: 2,
      name: 'Librería del Centro',
      tax_id: null,
      owner_username: 'admin',
      account_count: 2,
      created_at: '2024-03-15T14:30:00Z',
      updated_at: '2024-03-15T14:30:00Z',
    },
    {
      id: 3,
      name: 'Panadería San Martín',
      tax_id: '27-98765432-1',
      owner_username: 'student1',
      account_count: 0,
      created_at: '2024-04-01T09:00:00Z',
      updated_at: '2024-04-01T09:00:00Z',
    },
  ]
}

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  return auth !== null && auth.startsWith('Bearer ')
}

export const companiesHandlers = [
  // GET /companies/
  http.get(`${BASE}/companies/`, async ({ request }) => {
    await delay(150)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    return HttpResponse.json({
      count: mockCompanies.length,
      next: null,
      previous: null,
      results: mockCompanies,
    })
  }),

  // POST /companies/
  http.post(`${BASE}/companies/`, async ({ request }) => {
    await delay(200)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { name?: string; tax_id?: string }

    if (!body.name) {
      return HttpResponse.json({ name: ['Este campo es obligatorio.'] }, { status: 400 })
    }

    const newCompany: Company = {
      id: nextId++,
      name: body.name,
      tax_id: body.tax_id ?? null,
      owner_username: 'admin',
      account_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockCompanies.push(newCompany)

    return HttpResponse.json(newCompany, { status: 201 })
  }),

  // GET /companies/:id/
  http.get(`${BASE}/companies/:id/`, async ({ request, params }) => {
    await delay(100)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const company = mockCompanies.find((c) => c.id === Number(params.id))
    if (!company) {
      return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    }

    return HttpResponse.json(company)
  }),

  // PUT /companies/:id/
  http.put(`${BASE}/companies/:id/`, async ({ request, params }) => {
    await delay(200)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const idx = mockCompanies.findIndex((c) => c.id === Number(params.id))
    if (idx === -1) {
      return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    }

    const body = (await request.json()) as { name?: string; tax_id?: string }

    if (!body.name) {
      return HttpResponse.json({ name: ['Este campo es obligatorio.'] }, { status: 400 })
    }

    mockCompanies[idx] = {
      ...mockCompanies[idx],
      name: body.name,
      tax_id: body.tax_id ?? null,
    }

    return HttpResponse.json(mockCompanies[idx])
  }),

  // DELETE /companies/:id/
  http.delete(`${BASE}/companies/:id/`, async ({ request, params }) => {
    await delay(200)

    if (!isAuthorized(request)) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const idx = mockCompanies.findIndex((c) => c.id === Number(params.id))
    if (idx === -1) {
      return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    }

    mockCompanies.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
