import { isAxiosError } from 'axios'
import { fetchAllPages } from '@/shared/lib/fetchAllPages'
import { httpClient } from '@/shared/lib/http'
import {
  normalizeTeacherAvailableStudentsPayload,
  normalizeTeacherCourseDemoCompaniesPayload,
  normalizeTeacherCoursesOverviewPayload,
  normalizeTeacherCourseCompaniesPayload,
  normalizeTeacherCourseJournalEntriesPayload,
  normalizeTeacherCoursesPayload,
  normalizeTeacherStudentContextPayload,
} from '@/features/teacher/adapters/teacher.adapters'
import type {
  CourseCreatePayload,
  CourseItem,
  TeacherAvailableStudentsParams,
  TeacherAvailableStudentsResponse,
  TeacherCourseDemoCompaniesResponse,
  TeacherCourseCompaniesResponse,
  TeacherCourseDemoVisibilityPayload,
  TeacherCourseOverviewItem,
  TeacherCourseJournalEntry,
  TeacherJournalFilters,
  TeacherStudentContextResponse,
} from '@/features/teacher/types/teacher.types'

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

async function fetchTeacherCourseCompaniesSummaryPayload(courseId: number): Promise<unknown> {
  return httpClient
    .get<unknown>(`/teacher/courses/${courseId}/companies/summary/`)
    .then((response) => response.data)
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
      .then((response) => response.data)
  } catch (error) {
    if (!isAxiosError(error) || error.response?.status !== 404) {
      throw error
    }

    return fetchAllPages<unknown>((page) =>
      httpClient
        .get<unknown>(`/teacher/courses/${courseId}/journal-entries/`, {
          params: buildTeacherJournalQueryParams({ ...filters, page }),
        })
        .then((response) => response.data)
    )
  }
}

export const teacherApi = {
  listCourses: (): Promise<CourseItem[]> =>
    httpClient
      .get<unknown>('/courses/', {
        params: { all: true, summary: 'selector' },
      })
      .then((response) => normalizeTeacherCoursesPayload(response.data)),

  coursesOverview: (): Promise<TeacherCourseOverviewItem[]> =>
    httpClient
      .get<unknown>('/teacher/courses/overview/')
      .then((response) => normalizeTeacherCoursesOverviewPayload(response.data)),

  createCourse: (payload: CourseCreatePayload): Promise<void> =>
    httpClient
      .post('/courses/', {
        name: payload.name,
        ...(payload.code ? { code: payload.code } : null),
        ...(payload.teacher_id ? { teacher_id: payload.teacher_id } : null),
      })
      .then(() => undefined),

  courseCompaniesSummary: async (courseId: number): Promise<TeacherCourseCompaniesResponse> =>
    fetchTeacherCourseCompaniesSummaryPayload(courseId).then((payload) =>
      normalizeTeacherCourseCompaniesPayload(payload, courseId)
    ),

  courseJournalEntries: (
    courseId: number,
    filters?: TeacherJournalFilters
  ): Promise<TeacherCourseJournalEntry[]> =>
    fetchTeacherCourseJournalEntriesPayload(courseId, filters).then(
      (payload) => normalizeTeacherCourseJournalEntriesPayload(payload).entries
    ),

  availableStudents: (
    courseId: number,
    params?: TeacherAvailableStudentsParams
  ): Promise<TeacherAvailableStudentsResponse> =>
    httpClient
      .get<unknown>('/teacher/students/available/', {
        params: {
          course_id: courseId,
          ...(params?.search ? { search: params.search } : null),
          ...(params?.page ? { page: params.page } : null),
        },
      })
      .then((response) => normalizeTeacherAvailableStudentsPayload(response.data)),

  courseDemoCompanies: (courseId: number): Promise<TeacherCourseDemoCompaniesResponse> =>
    httpClient
      .get<unknown>(`/courses/${courseId}/demo-companies/`)
      .then((response) => normalizeTeacherCourseDemoCompaniesPayload(response.data, courseId)),

  setCourseDemoVisibility: (
    courseId: number,
    companyId: number,
    payload: TeacherCourseDemoVisibilityPayload
  ) =>
    httpClient.patch<unknown>(`/courses/${courseId}/demo-companies/${companyId}/`, payload).then(
      (response) =>
        normalizeTeacherCourseDemoCompaniesPayload(
          {
            course_id: courseId,
            course_name: '',
            demo_companies: [response.data],
          },
          courseId
        ).demo_companies[0]
    ),

  enrollStudent: (courseId: number, studentId: number): Promise<void> =>
    httpClient.post(`/courses/${courseId}/enrollments/`, { student_id: studentId }).then(() => {}),

  unenrollStudent: (courseId: number, studentId: number): Promise<void> =>
    httpClient.delete(`/courses/${courseId}/enrollments/${studentId}/`).then(() => {}),

  studentContext: (
    studentId: number,
    params?: { companyId?: number; entriesLimit?: number }
  ): Promise<TeacherStudentContextResponse> =>
    httpClient
      .get<unknown>(`/teacher/students/${studentId}/context/`, {
        params: {
          ...(params?.companyId ? { company_id: params.companyId } : null),
          ...(params?.entriesLimit ? { entries_limit: params.entriesLimit } : null),
        },
      })
      .then((response) => normalizeTeacherStudentContextPayload(response.data)),
}
