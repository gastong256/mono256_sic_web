import { httpClient } from '@/shared/lib/http'
import type { TeacherDashboardResponse } from '@/shared/types'
import type {
  TeacherCompanyItem,
  TeacherCourseCompaniesResponse,
  TeacherCourseJournalEntriesResponse,
  TeacherCourseJournalEntry,
} from '@/features/teacher/types/teacher.types'

type Course = {
  id: number
  name: string
  teacher_username?: string
}

function extractCount(payload: TeacherCourseJournalEntriesResponse): number {
  return typeof payload.count === 'number' ? payload.count : payload.results.length
}

export const teacherApi = {
  dashboard: async (): Promise<TeacherDashboardResponse> => {
    const courses = await httpClient.get<Course[]>('/courses/').then((r) => r.data)

    const dashboardCourses = await Promise.all(
      courses.map(async (course) => {
        const courseCompanies = await httpClient
          .get<TeacherCourseCompaniesResponse>(`/teacher/courses/${course.id}/companies/`)
          .then((r) => r.data)

        const students = await Promise.all(
          courseCompanies.students.map(async (student) => {
            const journalPayload = await httpClient
              .get<TeacherCourseJournalEntriesResponse>(
                `/teacher/courses/${course.id}/journal-entries/`,
                {
                  params: { student_id: student.student_id },
                }
              )
              .then((r) => r.data)

            return {
              id: student.student_id,
              username: student.student_username,
              full_name: student.student_full_name,
              course_id: course.id,
              course_name: course.name,
              company_count: student.companies.length,
              journal_entry_count: extractCount(journalPayload),
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

  studentCompanies: async (courseId: number, studentId: number): Promise<TeacherCompanyItem[]> => {
    const grouped = await httpClient
      .get<TeacherCourseCompaniesResponse>(`/teacher/courses/${courseId}/companies/`)
      .then((r) => r.data)
    const student = grouped.students.find((candidate) => candidate.student_id === studentId)
    return student?.companies ?? []
  },

  companyJournal: (
    courseId: number,
    studentId: number,
    companyId: number
  ): Promise<TeacherCourseJournalEntry[]> =>
    httpClient
      .get<TeacherCourseJournalEntriesResponse>(`/teacher/courses/${courseId}/journal-entries/`, {
        params: { student_id: studentId, company_id: companyId },
      })
      .then((r) => r.data.results.map((entry) => ({ ...entry, lines: entry.lines ?? [] }))),
}
