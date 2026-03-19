import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  canAccessCompany,
  createOpeningEntry,
  createCompany,
  deleteCompany,
  executeClosing,
  getClosingSnapshotById,
  getClosingState,
  getCompanyById,
  getLatestClosingSnapshot,
  getLogicalExercises,
  getRequestUser,
  listJournalEntriesByCompany,
  listCompaniesForUser,
  setDemoPublication,
  updateCompany,
  buildClosingPreviewResponse,
} from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL
const PAGE_SIZE = 25

function isAllParam(value: string | null): boolean {
  if (!value) return false
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
}

export const companiesHandlers = [
  http.get(`${BASE}/companies/`, async ({ request }) => {
    await delay(140)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const all = isAllParam(url.searchParams.get('all'))
    const summary = url.searchParams.get('summary')
    const pageRaw = Number(url.searchParams.get('page') ?? '1')
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1

    const companies = listCompaniesForUser(user).map((company) =>
      summary === 'selector'
        ? {
            id: company.id,
            name: company.name,
            owner_username: company.owner_username,
          }
        : company
    )

    if (all) {
      return HttpResponse.json({
        count: companies.length,
        next: null,
        previous: null,
        results: companies,
      })
    }

    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const results = companies.slice(start, end)
    const next = end < companies.length ? `${BASE}/companies/?page=${page + 1}` : null
    const previous = page > 1 ? `${BASE}/companies/?page=${page - 1}` : null

    return HttpResponse.json({ count: companies.length, next, previous, results })
  }),

  http.post(`${BASE}/companies/`, async ({ request }) => {
    await delay(180)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as {
      name?: string
      description?: string
      tax_id?: string
      opening_entry?: Parameters<typeof createOpeningEntry>[1]
    }
    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json({ name: ['Este campo es obligatorio.'] }, { status: 400 })
    }

    const ownerUsername = user.role === 'student' ? user.username : user.username
    const created = createCompany(ownerUsername, {
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      tax_id: body.tax_id?.trim() || undefined,
      opening_entry: body.opening_entry,
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
    if (current.is_read_only) {
      return HttpResponse.json({ detail: 'La empresa está en modo solo lectura.' }, { status: 409 })
    }

    const body = (await request.json()) as { name?: string; description?: string; tax_id?: string }
    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json({ name: ['Este campo es obligatorio.'] }, { status: 400 })
    }

    const updated = updateCompany(companyId, {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      tax_id: body.tax_id?.trim() || null,
    })

    if (!updated) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return HttpResponse.json(updated)
  }),

  http.patch(`${BASE}/companies/:id/demo-publication/`, async ({ request, params }) => {
    await delay(160)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'admin') {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const companyId = Number(params.id)
    const current = getCompanyById(companyId)
    if (!current) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })

    const body = (await request.json()) as { is_published?: boolean }
    if (typeof body.is_published !== 'boolean') {
      return HttpResponse.json({ is_published: ['Este campo es obligatorio.'] }, { status: 400 })
    }

    const updated = setDemoPublication(companyId, body.is_published)
    if ('error' in updated) {
      return HttpResponse.json({ detail: updated.error }, { status: updated.status })
    }

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
    if (current.is_read_only) {
      return HttpResponse.json({ detail: 'La empresa está en modo solo lectura.' }, { status: 409 })
    }
    if (listJournalEntriesByCompany(companyId).length > 0) {
      return HttpResponse.json(
        { detail: 'La empresa tiene registros contables protegidos y no puede eliminarse.' },
        { status: 409 }
      )
    }

    deleteCompany(companyId)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${BASE}/companies/:id/opening-entry/`, async ({ request, params }) => {
    await delay(220)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.id)
    const current = getCompanyById(companyId)
    if (!current) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!canAccessCompany(user, current)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as Parameters<typeof createOpeningEntry>[1]
    const created = createOpeningEntry(companyId, body, user.username)
    if ('error' in created) {
      return HttpResponse.json({ detail: created.error }, { status: created.status })
    }

    return HttpResponse.json(created, { status: 201 })
  }),

  http.get(`${BASE}/companies/:id/closing/state/`, async ({ request, params }) => {
    await delay(140)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.id)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!canAccessCompany(user, company)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const state = getClosingState(companyId)
    if (!state) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return HttpResponse.json(state)
  }),

  http.get(`${BASE}/companies/:id/logical-exercises/`, async ({ request, params }) => {
    await delay(140)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.id)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!canAccessCompany(user, company)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const logicalExercises = getLogicalExercises(companyId)
    if (!logicalExercises) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return HttpResponse.json(logicalExercises)
  }),

  http.post(`${BASE}/companies/:id/closing/preview/`, async ({ request, params }) => {
    await delay(220)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.id)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!(user.role === 'admin' || company.owner_username === user.username)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as Parameters<typeof buildClosingPreviewResponse>[1]
    const preview = buildClosingPreviewResponse(companyId, body)
    if ('error' in preview) {
      return HttpResponse.json({ detail: preview.error }, { status: preview.status })
    }

    return HttpResponse.json(preview)
  }),

  http.post(`${BASE}/companies/:id/closing/execute/`, async ({ request, params }) => {
    await delay(260)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.id)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!(user.role === 'admin' || company.owner_username === user.username)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as Parameters<typeof executeClosing>[1]
    const response = executeClosing(companyId, body, user.username)
    if ('error' in response) {
      return HttpResponse.json({ detail: response.error }, { status: response.status })
    }

    return HttpResponse.json(response)
  }),

  http.get(`${BASE}/companies/:id/closing/latest-snapshot/`, async ({ request, params }) => {
    await delay(160)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.id)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!canAccessCompany(user, company)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const snapshot = getLatestClosingSnapshot(companyId)
    if (!snapshot) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return HttpResponse.json(snapshot)
  }),

  http.get(`${BASE}/companies/:id/closing/snapshots/:snapshotId/`, async ({ request, params }) => {
    await delay(160)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.id)
    const snapshotId = Number(params.snapshotId)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    if (!canAccessCompany(user, company)) {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const snapshot = getClosingSnapshotById(companyId, snapshotId)
    if (!snapshot) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    return HttpResponse.json(snapshot)
  }),
]
