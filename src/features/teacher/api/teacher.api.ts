import { httpClient } from '@/shared/lib/http'
import type { Company } from '@/features/companies/types/company.types'
import type { JournalEntryDetail } from '@/features/journal/types/journal.types'
import type { TeacherDashboardResponse } from '@/shared/types'

type Course = {
  id: number
  name: string
  teacher_username?: string
}

type CourseStudentCompanies = {
  student_id: number
  student_username: string
  student_full_name?: string
  companies: Company[]
}

type CourseCompaniesResponse = {
  course_id: number
  course_name?: string
  students: CourseStudentCompanies[]
}

type Paginated<T> = {
  count?: number
  next?: string | null
  previous?: string | null
  results?: T[]
}

function toArray<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload
  return payload.results ?? []
}

function extractCount<T>(payload: T[] | Paginated<T>, fallback: number): number {
  if (Array.isArray(payload)) return payload.length
  return typeof payload.count === 'number' ? payload.count : fallback
}

export const teacherApi = {
  dashboard: async (): Promise<TeacherDashboardResponse> => {
    const courses = await httpClient.get<Course[]>('/courses/').then((r) => r.data)

    const dashboardCourses = await Promise.all(
      courses.map(async (course) => {
        const courseCompanies = await httpClient
          .get<CourseCompaniesResponse>(`/teacher/courses/${course.id}/companies/`)
          .then((r) => r.data)

        const students = await Promise.all(
          courseCompanies.students.map(async (student) => {
            const journalPayload = await httpClient
              .get<
                JournalEntryDetail[] | Paginated<JournalEntryDetail>
              >(`/teacher/courses/${course.id}/journal-entries/`, { params: { student_id: student.student_id } })
              .then((r) => r.data)

            const journalEntries = toArray(journalPayload)
            return {
              id: student.student_id,
              username: student.student_username,
              full_name: student.student_full_name ?? student.student_username,
              course_id: course.id,
              course_name: course.name,
              company_count: student.companies.length,
              journal_entry_count: extractCount(journalPayload, journalEntries.length),
            }
          })
        )

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

  studentCompanies: async (courseId: number, studentId: number): Promise<Company[]> => {
    const grouped = await httpClient
      .get<CourseCompaniesResponse>(`/teacher/courses/${courseId}/companies/`)
      .then((r) => r.data)
    const student = grouped.students.find((candidate) => candidate.student_id === studentId)
    return student?.companies ?? []
  },

  companyJournal: (
    courseId: number,
    studentId: number,
    companyId: number
  ): Promise<JournalEntryDetail[]> =>
    httpClient
      .get<
        JournalEntryDetail[] | Paginated<JournalEntryDetail>
      >(`/teacher/courses/${courseId}/journal-entries/`, { params: { student_id: studentId, company_id: companyId } })
      .then((r) => toArray(r.data).map((entry) => ({ ...entry, lines: entry.lines ?? [] }))),
}
