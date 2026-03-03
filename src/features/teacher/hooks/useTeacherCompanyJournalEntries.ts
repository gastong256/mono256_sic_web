import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'

export const teacherCompanyJournalQueryKey = (
  courseId: number,
  studentId: number,
  companyId: number
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
  ] as const

export function useTeacherCompanyJournalEntries(
  courseId: number,
  studentId: number,
  companyId: number | null
) {
  return useQuery({
    queryKey: teacherCompanyJournalQueryKey(courseId, studentId, companyId ?? 0),
    queryFn: () => teacherApi.companyJournal(courseId, studentId, companyId!),
    enabled: courseId > 0 && studentId > 0 && companyId !== null && companyId > 0,
  })
}
