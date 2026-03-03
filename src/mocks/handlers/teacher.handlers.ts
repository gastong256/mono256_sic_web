import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  getRequestUser,
  getRegistrationCode,
  listCoursesForUser,
  listTeacherCourseCompanies,
  listTeacherCourseJournalEntries,
} from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL

export const teacherHandlers = [
  http.get(`${BASE}/teacher/registration-code/`, async ({ request }) => {
    await delay(100)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    return HttpResponse.json(getRegistrationCode())
  }),

  http.get(`${BASE}/courses/`, async ({ request }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    return HttpResponse.json(listCoursesForUser(user))
  }),

  http.get(`${BASE}/teacher/courses/:courseId/companies/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const data = listTeacherCourseCompanies(user, Number(params.courseId))
    if (data === null) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    return HttpResponse.json(data)
  }),

  http.get(`${BASE}/teacher/courses/:courseId/journal-entries/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const studentIdParam = url.searchParams.get('student_id')
    const companyIdParam = url.searchParams.get('company_id')
    const dateFrom = url.searchParams.get('date_from') ?? undefined
    const dateTo = url.searchParams.get('date_to') ?? undefined

    const data = listTeacherCourseJournalEntries(user, Number(params.courseId), {
      student_id: studentIdParam ? Number(studentIdParam) : undefined,
      company_id: companyIdParam ? Number(companyIdParam) : undefined,
      date_from: dateFrom,
      date_to: dateTo,
    })

    if (data === null) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    return HttpResponse.json(data)
  }),
]
