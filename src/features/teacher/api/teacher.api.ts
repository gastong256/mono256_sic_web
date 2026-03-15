import { httpClient } from '@/shared/lib/http'
import { fetchAllPages } from '@/shared/lib/fetchAllPages'
import { extractListPayload, extractPaginationMeta } from '@/shared/lib/apiPagination'
import { isAxiosError } from 'axios'
import {
  normalizeTeacherAvailableStudentsPayload,
  normalizeTeacherCourseCompaniesPayload,
  normalizeTeacherCourseJournalEntriesPayload,
} from '@/features/teacher/adapters/teacher.adapters'
import type {
  CourseEnrollmentItem,
  CourseEnrollmentsResponse,
  CourseItem,
  CourseCreatePayload,
  CourseUpdatePayload,
  TeacherAvailableStudentsResponse,
  TeacherCompanyItem,
  TeacherCourseJournalEntry,
} from '@/features/teacher/types/teacher.types'

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeCourse(value: unknown): CourseItem | null {
  if (!isRecord(value)) return null
  const id = toNumberValue(value.id)
  if (id <= 0) return null

  return {
    id,
    name: typeof value.name === 'string' ? value.name : '',
    ...(typeof value.code === 'string' ? { code: value.code } : {}),
    ...(value.teacher_id === null || typeof value.teacher_id === 'number'
      ? { teacher_id: value.teacher_id }
      : {}),
    ...(typeof value.teacher_username === 'string'
      ? { teacher_username: value.teacher_username }
      : {}),
    ...(typeof value.student_count === 'number' ? { student_count: value.student_count } : {}),
    ...(typeof value.created_at === 'string' ? { created_at: value.created_at } : {}),
    ...(typeof value.updated_at === 'string' ? { updated_at: value.updated_at } : {}),
  }
}

function normalizeCourses(payload: unknown): CourseItem[] {
  return extractListPayload<unknown>(payload)
    .map(normalizeCourse)
    .filter((course): course is CourseItem => Boolean(course))
}

function normalizeCourseEnrollment(value: unknown): CourseEnrollmentItem | null {
  if (!isRecord(value)) return null
  const studentId = toNumberValue(value.student_id ?? value.id)
  if (studentId <= 0) return null
  return {
    student_id: studentId,
    student_username:
      typeof value.student_username === 'string'
        ? value.student_username
        : typeof value.username === 'string'
          ? value.username
          : '',
    student_full_name: typeof value.student_full_name === 'string' ? value.student_full_name : '',
    ...(typeof value.created_at === 'string' ? { created_at: value.created_at } : {}),
  }
}

async function fetchTeacherCourseCompaniesPayload(courseId: number): Promise<unknown> {
  const firstPagePayload = await httpClient
    .get<unknown>(`/teacher/courses/${courseId}/companies/`, { params: { all: 'true' } })
    .then((r) => r.data)

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

async function fetchTeacherCourseCompaniesSummaryPayload(courseId: number): Promise<unknown> {
  return httpClient
    .get<unknown>(`/teacher/courses/${courseId}/companies/summary/`)
    .then((r) => r.data)
}

type TeacherJournalFilters = {
  dateFrom?: string
  dateTo?: string
  studentId?: number
  companyId?: number
}

function buildTeacherJournalQueryParams(
  filters: TeacherJournalFilters & { page?: number }
): Record<string, string | number> {
  return {
    ...(filters.studentId ? { student_id: filters.studentId } : null),
    ...(filters.companyId ? { company_id: filters.companyId } : null),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : null),
    ...(filters.dateTo ? { date_to: filters.dateTo } : null),
    ...(filters.page ? { page: filters.page } : null),
  }
}

async function fetchTeacherCourseJournalEntriesPayload(
  courseId: number,
  filters: TeacherJournalFilters = {}
): Promise<unknown> {
  try {
    return await httpClient
      .get<unknown>(`/teacher/courses/${courseId}/journal-entries/all/`, {
        params: buildTeacherJournalQueryParams(filters),
      })
      .then((r) => r.data)
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 404) {
      throw error
    }

    return fetchAllPages<unknown>((page) =>
      httpClient
        .get<unknown>(`/teacher/courses/${courseId}/journal-entries/`, {
          params: buildTeacherJournalQueryParams({ ...filters, page }),
        })
        .then((r) => r.data)
    )
  }
}

export const teacherApi = {
  listCourses: async (): Promise<CourseItem[]> =>
    fetchAllPages<unknown>((page) =>
      httpClient.get<unknown>('/courses/', { params: { page } }).then((r) => r.data)
    ).then((items) => normalizeCourses(items)),

  courseCompaniesSummary: async (courseId: number) =>
    fetchTeacherCourseCompaniesSummaryPayload(courseId).then((payload) =>
      normalizeTeacherCourseCompaniesPayload(payload, courseId)
    ),

  courseJournalEntries: (
    courseId: number,
    filters?: TeacherJournalFilters
  ): Promise<TeacherCourseJournalEntry[]> =>
    fetchTeacherCourseJournalEntriesPayload(courseId, filters).then(
      (entries) => normalizeTeacherCourseJournalEntriesPayload(entries).results
    ),

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
    teacherApi.courseJournalEntries(courseId, {
      studentId,
      companyId,
      dateFrom: params?.dateFrom,
      dateTo: params?.dateTo,
    }),

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

  getCourse: (courseId: number): Promise<CourseItem> =>
    httpClient.get<unknown>(`/courses/${courseId}/`).then((r) => {
      const normalized = normalizeCourse(r.data)
      if (!normalized) throw new Error('No se pudo normalizar el curso solicitado.')
      return normalized
    }),

  updateCourse: (courseId: number, payload: CourseUpdatePayload): Promise<CourseItem> =>
    httpClient.patch<unknown>(`/courses/${courseId}/`, payload).then((r) => {
      const normalized = normalizeCourse(r.data)
      if (!normalized) throw new Error('No se pudo normalizar el curso actualizado.')
      return normalized
    }),

  deleteCourse: (courseId: number): Promise<void> =>
    httpClient.delete(`/courses/${courseId}/`).then(() => undefined),

  listCourseEnrollments: (
    courseId: number,
    params?: { page?: number }
  ): Promise<CourseEnrollmentsResponse> =>
    httpClient.get<unknown>(`/courses/${courseId}/enrollments/`, { params }).then((r) => {
      const payload = r.data
      const results = extractListPayload<unknown>(payload)
        .map(normalizeCourseEnrollment)
        .filter((entry): entry is CourseEnrollmentItem => entry !== null)
      const meta = extractPaginationMeta(payload, results.length)

      return {
        count: meta.count ?? results.length,
        next: meta.next,
        previous: meta.previous,
        results,
      }
    }),
}
