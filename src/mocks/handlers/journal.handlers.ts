import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  canAccessCompany,
  createJournalEntry,
  getCompanyById,
  getJournalEntry,
  getRequestUser,
  listJournalEntriesByCompany,
  reverseJournalEntry,
} from '@/mocks/data/mockDb'
import type { CreateJournalEntryPayload } from '@/features/journal/types/journal.types'
import type { ReverseJournalEntryPayload } from '@/features/journal/types/journal.types'

const BASE = env.VITE_API_BASE_URL
const PAGE_SIZE = 25

function buildPageLink(path: string, page: number): string {
  return `${path}?page=${page}`
}

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
    if (company.accounting_ready === false) {
      return HttpResponse.json(
        {
          detail:
            'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
        },
        { status: 409 }
      )
    }

    const url = new URL(request.url)
    const pageRaw = Number(url.searchParams.get('page') ?? '1')
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1

    const allEntries = listJournalEntriesByCompany(companyId)
    const count = allEntries.length
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const results = allEntries.slice(start, end)

    return HttpResponse.json({
      count,
      next: end < count ? buildPageLink(`${BASE}/companies/${companyId}/journal/`, page + 1) : null,
      previous:
        page > 1 ? buildPageLink(`${BASE}/companies/${companyId}/journal/`, page - 1) : null,
      results,
    })
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
    if (company.accounting_ready === false) {
      return HttpResponse.json(
        {
          detail:
            'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
        },
        { status: 409 }
      )
    }

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
      return HttpResponse.json({ detail: created.error }, { status: created.status })
    }

    return HttpResponse.json(created, { status: 201 })
  }),

  http.post(
    `${BASE}/companies/:companyId/journal/:entryId/reverse/`,
    async ({ request, params }) => {
      await delay(180)

      const user = getRequestUser(request)
      if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

      const companyId = Number(params.companyId)
      const company = getCompanyById(companyId)
      if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
      if (!canAccessCompany(user, company))
        return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
      if (company.accounting_ready === false) {
        return HttpResponse.json(
          {
            detail:
              'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.',
          },
          { status: 409 }
        )
      }

      const body = (await request.json()) as ReverseJournalEntryPayload
      const reversed = reverseJournalEntry(companyId, Number(params.entryId), body, user.username)
      if ('error' in reversed) {
        return HttpResponse.json({ detail: reversed.error }, { status: reversed.status })
      }

      return HttpResponse.json(reversed, { status: 201 })
    }
  ),
]
