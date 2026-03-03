import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  canAccessCompany,
  createJournalEntry,
  getCompanyById,
  getJournalEntry,
  getRequestUser,
  listJournalEntriesByCompany,
} from '@/mocks/data/mockDb'
import type { CreateJournalEntryPayload } from '@/features/journal/types/journal.types'

const BASE = env.VITE_API_BASE_URL

export const journalHandlers = [
  http.get(`${BASE}/companies/:companyId/journal/`, async ({ request, params }) => {
    await delay(140)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.companyId)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
    if (!canAccessCompany(user, company))
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    return HttpResponse.json(listJournalEntriesByCompany(companyId))
  }),

  http.get(`${BASE}/companies/:companyId/journal/:entryId/`, async ({ request, params }) => {
    await delay(100)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.companyId)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
    if (!canAccessCompany(user, company))
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    const entry = getJournalEntry(companyId, Number(params.entryId))
    if (!entry) return HttpResponse.json({ detail: 'Not found.' }, { status: 404 })

    return HttpResponse.json(entry)
  }),

  http.post(`${BASE}/companies/:companyId/journal/`, async ({ request, params }) => {
    await delay(230)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companyId = Number(params.companyId)
    const company = getCompanyById(companyId)
    if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
    if (!canAccessCompany(user, company))
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    const body = (await request.json()) as CreateJournalEntryPayload
    if (!body.date)
      return HttpResponse.json({ date: ['Este campo es obligatorio.'] }, { status: 400 })
    if (!body.description) {
      return HttpResponse.json({ description: ['Este campo es obligatorio.'] }, { status: 400 })
    }

    const created = createJournalEntry(companyId, body, user.username)
    if ('error' in created) {
      return HttpResponse.json({ detail: created.error }, { status: 400 })
    }

    return HttpResponse.json(created, { status: 201 })
  }),
]
