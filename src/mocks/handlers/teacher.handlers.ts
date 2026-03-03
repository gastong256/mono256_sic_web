import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  buildTeacherDashboard,
  canReviewCompany,
  getCompanyById,
  getRequestUser,
  listCompaniesForStudentAsTeacher,
  listJournalEntriesByCompany,
} from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL

export const teacherHandlers = [
  http.get(`${BASE}/teacher/dashboard/`, async ({ request }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const dashboard = buildTeacherDashboard(user)
    if (!dashboard) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    return HttpResponse.json(dashboard)
  }),

  http.get(`${BASE}/teacher/students/:studentId/companies/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const companies = listCompaniesForStudentAsTeacher(user, Number(params.studentId))
    if (companies === null) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    return HttpResponse.json(companies)
  }),

  http.post(`${BASE}/teacher/students/:studentId/companies/`, () =>
    HttpResponse.json({ detail: 'Read-only endpoint in teacher panel.' }, { status: 403 })
  ),

  http.get(`${BASE}/teacher/companies/:companyId/journal/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const company = getCompanyById(Number(params.companyId))
    if (!company) return HttpResponse.json({ detail: 'Company not found' }, { status: 404 })
    if (!canReviewCompany(user, company))
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    return HttpResponse.json(listJournalEntriesByCompany(company.id))
  }),

  http.post(`${BASE}/teacher/companies/:companyId/journal/`, () =>
    HttpResponse.json({ detail: 'Read-only endpoint in teacher panel.' }, { status: 403 })
  ),
]
