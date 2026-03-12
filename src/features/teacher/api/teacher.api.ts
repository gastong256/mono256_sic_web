import { httpClient } from '@/shared/lib/http'
import type { TeacherDashboardResponse } from '@/shared/types'
import { fetchAllPages } from '@/shared/lib/fetchAllPages'
import { extractListPayload, extractPaginationMeta } from '@/shared/lib/apiPagination'
import {
  normalizeTeacherAvailableStudentsPayload,
  normalizeTeacherCourseCompaniesPayload,
  normalizeTeacherCourseJournalEntriesPayload,
} from '@/features/teacher/adapters/teacher.adapters'
import type {
  CourseCreatePayload,
  TeacherAvailableStudentsResponse,
  TeacherCompanyItem,
  TeacherCourseJournalEntry,
} from '@/features/teacher/types/teacher.types'

type UnknownRecord = Record<string, unknown>

type Course = {
  id: number
  name: string
  teacher_username?: string
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function normalizeCourses(payload: unknown): Course[] {
  return extractListPayload<unknown>(payload)
    .map((course) => {
      if (!isRecord(course) || typeof course.id !== 'number') return null
      const normalized: Course = {
        id: course.id,
        name: typeof course.name === 'string' ? course.name : '',
        ...(typeof course.teacher_username === 'string'
          ? { teacher_username: course.teacher_username }
          : {}),
      }
      return normalized
    })
    .filter((course): course is Course => Boolean(course))
}

function buildStudentJournalCountMap(entries: TeacherCourseJournalEntry[]): Map<number, number> {
  const map = new Map<number, number>()
  entries.forEach((entry) => {
    map.set(entry.student_id, (map.get(entry.student_id) ?? 0) + 1)
  })
  return map
}

async function fetchTeacherCourseCompaniesPayload(courseId: number): Promise<unknown> {
  const firstPagePayload = await httpClient
    .get<unknown>(`/teacher/courses/${courseId}/companies/`, { params: { page: 1 } })
    .then((r) => r.data)

  if (isRecord(firstPagePayload) && Array.isArray(firstPagePayload.students)) {
    return firstPagePayload
  }

  const firstPageItems = extractListPayload<unknown>(firstPagePayload)
  const firstMeta = extractPaginationMeta(firstPagePayload, firstPageItems.length)
  if (!firstMeta.next) return firstPagePayload

  const remainingItems = await fetchAllPages<unknown>(
    (page) =>
      httpClient
        .get<unknown>(`/teacher/courses/${courseId}/companies/`, { params: { page } })
        .then((r) => r.data),
    { startPage: 2 }
  )

  return [...firstPageItems, ...remainingItems]
}

export const teacherApi = {
  dashboard: async (): Promise<TeacherDashboardResponse> => {
    const courses = await fetchAllPages<unknown>((page) =>
      httpClient.get<unknown>('/courses/', { params: { page } }).then((r) => r.data)
    ).then((items) => normalizeCourses(items))

    const dashboardCourses = await Promise.all(
      courses.map(async (course) => {
        const [allCompaniesPayload, allCourseJournalEntries] = await Promise.all([
          fetchTeacherCourseCompaniesPayload(course.id),
          fetchAllPages<unknown>((page) =>
            httpClient
              .get<unknown>(`/teacher/courses/${course.id}/journal-entries/`, { params: { page } })
              .then((r) => r.data)
          ).then((items) => normalizeTeacherCourseJournalEntriesPayload(items).results),
        ])

        const courseCompanies = normalizeTeacherCourseCompaniesPayload(
          allCompaniesPayload,
          course.id
        )
        const countMap = buildStudentJournalCountMap(allCourseJournalEntries)

        const students = courseCompanies.students.map((student) => ({
          id: student.student_id,
          username: student.student_username,
          full_name: student.student_full_name,
          course_id: course.id,
          course_name: course.name,
          company_count: student.companies.length,
          journal_entry_count: countMap.get(student.student_id) ?? 0,
        }))

        return {
          id: course.id,
          name: course.name,
          teacher_username: course.teacher_username ?? '',
          students_count: students.length,
          students,
        }
      })
    )

    return { courses: dashboardCourses }
  },

  studentCompanies: async (courseId: number, studentId: number): Promise<TeacherCompanyItem[]> => {
    const payload = await fetchTeacherCourseCompaniesPayload(courseId)
    const grouped = normalizeTeacherCourseCompaniesPayload(payload, courseId)
    const student = grouped.students.find((candidate) => candidate.student_id === studentId)
    return student?.companies ?? []
  },

  companyJournal: (
    courseId: number,
    studentId: number,
    companyId: number,
    params?: { dateFrom?: string; dateTo?: string }
  ): Promise<TeacherCourseJournalEntry[]> =>
    fetchAllPages<unknown>((page) =>
      httpClient
        .get<unknown>(`/teacher/courses/${courseId}/journal-entries/`, {
          params: {
            student_id: studentId,
            company_id: companyId,
            ...(params?.dateFrom ? { date_from: params.dateFrom } : null),
            ...(params?.dateTo ? { date_to: params.dateTo } : null),
            page,
          },
        })
        .then((r) => r.data)
    ).then((entries) => normalizeTeacherCourseJournalEntriesPayload(entries).results),

  availableStudents: (
    courseId: number,
    params?: { search?: string; page?: number }
  ): Promise<TeacherAvailableStudentsResponse> =>
    httpClient
      .get<unknown>('/teacher/students/available/', {
        params: {
          course_id: courseId,
          ...(params?.search ? { search: params.search } : null),
          ...(params?.page ? { page: params.page } : null),
        },
      })
      .then((r) => normalizeTeacherAvailableStudentsPayload(r.data)),

  enrollStudent: (courseId: number, studentId: number): Promise<void> =>
    httpClient.post(`/courses/${courseId}/enrollments/`, { student_id: studentId }).then(() => {}),

  unenrollStudent: (courseId: number, studentId: number): Promise<void> =>
    httpClient.delete(`/courses/${courseId}/enrollments/${studentId}/`).then(() => {}),

  createCourse: (payload: CourseCreatePayload): Promise<void> =>
    httpClient
      .post('/courses/', {
        name: payload.name,
        ...(payload.code ? { code: payload.code } : null),
        ...(payload.teacher_id ? { teacher_id: payload.teacher_id } : null),
      })
      .then(() => {}),
}
