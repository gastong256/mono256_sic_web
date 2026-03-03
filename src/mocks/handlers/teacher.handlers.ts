import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  createCourseForUser,
  enrollStudentInCourse,
  getRequestUser,
  getRegistrationCode,
  listAvailableStudentsForCourse,
  listCoursesForUser,
  listTeacherCourseCompanies,
  listTeacherCourseJournalEntries,
  unenrollStudentFromCourse,
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

  http.post(`${BASE}/courses/`, async ({ request }) => {
    await delay(140)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { name?: string; code?: string; teacher_id?: number }
    const created = createCourseForUser(user, body)
    if ('error' in created) {
      if (created.status === 400) {
        return HttpResponse.json({ name: ['Este campo es obligatorio.'] }, { status: 400 })
      }
      return HttpResponse.json({ detail: created.error }, { status: created.status })
    }

    return HttpResponse.json(created, { status: 201 })
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

  http.get(`${BASE}/teacher/students/available/`, async ({ request }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const courseId = Number(url.searchParams.get('course_id'))
    if (!Number.isFinite(courseId) || courseId <= 0) {
      return HttpResponse.json({ detail: 'Invalid course_id' }, { status: 400 })
    }

    const search = url.searchParams.get('search') ?? undefined
    const page = Number(url.searchParams.get('page') ?? '1')

    const data = listAvailableStudentsForCourse(user, courseId, {
      search,
      page: Number.isFinite(page) && page > 0 ? page : 1,
    })

    if (data === null) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    return HttpResponse.json(data)
  }),

  http.post(`${BASE}/courses/:courseId/enrollments/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const courseId = Number(params.courseId)
    const body = (await request.json()) as { student_id?: number }
    if (!body.student_id || body.student_id <= 0) {
      return HttpResponse.json({ detail: 'Invalid student_id' }, { status: 400 })
    }

    const result = enrollStudentInCourse(user, courseId, body.student_id)
    if (!result.ok) {
      if (result.status === 400) {
        return HttpResponse.json({ student_id: [result.detail] }, { status: 400 })
      }
      return HttpResponse.json({ detail: result.detail }, { status: result.status })
    }
    return HttpResponse.json({ student_id: body.student_id }, { status: 201 })
  }),

  http.delete(`${BASE}/courses/:courseId/enrollments/:studentId/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const courseId = Number(params.courseId)
    const studentId = Number(params.studentId)
    const result = unenrollStudentFromCourse(user, courseId, studentId)
    if (!result.ok) {
      return HttpResponse.json({ detail: result.detail }, { status: result.status })
    }

    return new HttpResponse(null, { status: 204 })
  }),
]
