import { http, HttpResponse, delay } from 'msw'
import { env } from '@/shared/config/env'
import {
  createCourseForUser,
  deleteCourseForUser,
  enrollStudentInCourse,
  getCourseForUser,
  getRequestUser,
  getRegistrationCode,
  getTeacherStudentContext,
  listAvailableStudentsForCourse,
  listCourseEnrollmentsForUser,
  listCoursesForUser,
  listTeacherCoursesOverview,
  listTeacherCourseCompanies,
  listTeacherCourseJournalEntries,
  unenrollStudentFromCourse,
  updateCourseForUser,
} from '@/mocks/data/mockDb'

const BASE = env.VITE_API_BASE_URL
const PAGE_SIZE = 25

function isAllParam(value: string | null): boolean {
  if (!value) return false
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
}

function paginateFromRequest<T>(
  items: T[],
  request: Request,
  pageSize = PAGE_SIZE
): {
  count: number
  next: string | null
  previous: string | null
  results: T[]
} {
  const url = new URL(request.url)
  const pageRaw = Number(url.searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1
  const count = items.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const results = items.slice(start, end)

  const nextUrl = end < count ? new URL(request.url) : null
  if (nextUrl) {
    nextUrl.searchParams.set('page', String(page + 1))
  }
  const prevUrl = page > 1 ? new URL(request.url) : null
  if (prevUrl) {
    prevUrl.searchParams.set('page', String(page - 1))
  }

  return {
    count,
    next: nextUrl?.toString() ?? null,
    previous: prevUrl?.toString() ?? null,
    results,
  }
}

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

    const url = new URL(request.url)
    const all = isAllParam(url.searchParams.get('all'))
    const summary = url.searchParams.get('summary')
    const courses = listCoursesForUser(user).map((course) =>
      summary === 'selector'
        ? {
            id: course.id,
            name: course.name,
            code: course.code,
          }
        : course
    )

    if (all) {
      return HttpResponse.json({
        count: courses.length,
        next: null,
        previous: null,
        results: courses,
      })
    }

    return HttpResponse.json(paginateFromRequest(courses, request))
  }),

  http.get(`${BASE}/teacher/courses/overview/`, async ({ request }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'teacher' && user.role !== 'admin') {
      return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    return HttpResponse.json({
      courses: listTeacherCoursesOverview(user),
    })
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

  http.get(`${BASE}/courses/:courseId/`, async ({ request, params }) => {
    await delay(100)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const course = getCourseForUser(user, Number(params.courseId))
    if (!course) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    return HttpResponse.json(course)
  }),

  http.patch(`${BASE}/courses/:courseId/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as { name?: string; code?: string; teacher_id?: number }
    const result = updateCourseForUser(user, Number(params.courseId), body)
    if (!result.ok) {
      if (result.status === 400) {
        return HttpResponse.json({ name: ['Este campo es inválido.'] }, { status: 400 })
      }
      return HttpResponse.json({ detail: result.detail }, { status: result.status })
    }
    return HttpResponse.json(result.course)
  }),

  http.delete(`${BASE}/courses/:courseId/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const result = deleteCourseForUser(user, Number(params.courseId))
    if (!result.ok) return HttpResponse.json({ detail: result.detail }, { status: result.status })
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${BASE}/courses/:courseId/enrollments/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const enrollments = listCourseEnrollmentsForUser(user, Number(params.courseId))
    if (!enrollments) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    return HttpResponse.json(paginateFromRequest(enrollments, request))
  }),

  http.get(`${BASE}/teacher/courses/:courseId/companies/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const data = listTeacherCourseCompanies(user, Number(params.courseId))
    if (data === null) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })

    const url = new URL(request.url)
    const all = isAllParam(url.searchParams.get('all'))
    const students = data.students
    if (all) {
      return HttpResponse.json({
        course_id: data.course_id,
        course_name: data.course_name,
        count: students.length,
        next: null,
        previous: null,
        students,
      })
    }

    const paged = paginateFromRequest(students, request)
    return HttpResponse.json({
      course_id: data.course_id,
      course_name: data.course_name,
      count: paged.count,
      next: paged.next,
      previous: paged.previous,
      students: paged.results,
    })
  }),

  http.get(`${BASE}/teacher/courses/:courseId/companies/summary/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    const data = listTeacherCourseCompanies(user, Number(params.courseId))
    if (data === null) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    return HttpResponse.json({
      course_id: data.course_id,
      course_name: data.course_name,
      students: data.students,
    })
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

    const all = isAllParam(url.searchParams.get('all'))
    const entries = data.results
    if (all) {
      return HttpResponse.json({
        count: entries.length,
        next: null,
        previous: null,
        entries,
      })
    }

    const paged = paginateFromRequest(entries, request)
    return HttpResponse.json({
      count: paged.count,
      next: paged.next,
      previous: paged.previous,
      entries: paged.results,
    })
  }),

  http.get(
    `${BASE}/teacher/courses/:courseId/journal-entries/all/`,
    async ({ request, params }) => {
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
      return HttpResponse.json({
        count: data.results.length,
        next: null,
        previous: null,
        entries: data.results,
      })
    }
  ),

  http.get(`${BASE}/teacher/students/:studentId/context/`, async ({ request, params }) => {
    await delay(120)

    const user = getRequestUser(request)
    if (!user) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const companyId = Number(url.searchParams.get('company_id') ?? '0')
    const entriesLimit = Number(url.searchParams.get('entries_limit') ?? '25')
    const context = getTeacherStudentContext(user, Number(params.studentId), {
      ...(Number.isFinite(companyId) && companyId > 0 ? { company_id: companyId } : null),
      ...(Number.isFinite(entriesLimit) && entriesLimit > 0
        ? { entries_limit: entriesLimit }
        : null),
    })

    if (context === null) return HttpResponse.json({ detail: 'Forbidden' }, { status: 403 })
    return HttpResponse.json(context)
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
      pageSize: PAGE_SIZE,
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
