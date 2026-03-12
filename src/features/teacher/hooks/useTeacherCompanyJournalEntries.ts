import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'

export const teacherCompanyJournalQueryKey = (
  courseId: number,
  studentId: number,
  companyId: number,
  params?: { dateFrom?: string; dateTo?: string }
) =>
  [
    'teacher',
    'courses',
    courseId,
    'students',
    studentId,
    'companies',
    companyId,
    'journal',
    params?.dateFrom ?? null,
    params?.dateTo ?? null,
  ] as const

export function useTeacherCompanyJournalEntries(
  courseId: number,
  studentId: number,
  companyId: number | null,
  params?: { dateFrom?: string; dateTo?: string }
) {
  return useQuery({
    queryKey: teacherCompanyJournalQueryKey(courseId, studentId, companyId ?? 0, params),
    queryFn: () => teacherApi.companyJournal(courseId, studentId, companyId!, params),
    enabled: courseId > 0 && studentId > 0 && companyId !== null && companyId > 0,
  })
}
