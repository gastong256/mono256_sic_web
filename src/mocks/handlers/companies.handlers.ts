import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  canAccessCompany,
  createCompany,
  deleteCompany,
  getCompanyById,
  getRequestUser,
  listCompaniesForUser,
  updateCompany,
} from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL

export const companiesHandlers = [
  http.get(`${BASE}/companies/`, async ({ request }) => {
    await delay(140)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const results = listCompaniesForUser(user)
    return HttpResponse.json({ count: results.length, next: null, previous: null, results })
  }),

  http.post(`${BASE}/companies/`, async ({ request }) => {
    await delay(180)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { name?: string; tax_id?: string }
    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json({ name: ['Este campo es obligatorio.'] }, { status: 400 })
    }

    const ownerUsername = user.role === 'student' ? user.username : user.username
    const created = createCompany(ownerUsername, {
      name: body.name.trim(),
      tax_id: body.tax_id?.trim() || undefined,
    })

    return HttpResponse.json(created, { status: 201 })
  }),

  http.get(`${BASE}/companies/:id/`, async ({ request, params }) => {
    await delay(100)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const company = getCompanyById(Number(params.id))
    if (!company) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!canAccessCompany(user, company)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    return HttpResponse.json(company)
  }),

  http.put(`${BASE}/companies/:id/`, async ({ request, params }) => {
    await delay(180)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.id)
    const current = getCompanyById(companyId)
    if (!current) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!canAccessCompany(user, current))
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    const body = (await request.json()) as { name?: string; tax_id?: string }
    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json({ name: ['Este campo es obligatorio.'] }, { status: 400 })
    }

    const updated = updateCompany(companyId, {
      name: body.name.trim(),
      tax_id: body.tax_id?.trim() || null,
    })

    if (!updated) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  http.delete(`${BASE}/companies/:id/`, async ({ request, params }) => {
    await delay(180)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.id)
    const current = getCompanyById(companyId)
    if (!current) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!canAccessCompany(user, current))
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    deleteCompany(companyId)
    return new HttpResponse(null, { status: 204 })
  }),
]
