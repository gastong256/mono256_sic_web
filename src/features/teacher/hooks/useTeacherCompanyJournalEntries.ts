import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'
import type { TeacherJournalFilters } from '@/features/teacher/types/teacher.types'

export function useTeacherCompanyJournalEntries(
  courseId: number,
  studentId: number,
  companyId: number | null,
  params?: Pick<TeacherJournalFilters, 'dateFrom' | 'dateTo'>
) {
  return useQuery({
    queryKey: teacherQueryKeys.studentCompanyJournal(courseId, studentId, companyId ?? 0, params),
    queryFn: () =>
      teacherApi.courseJournalEntries(courseId, {
        studentId,
        companyId: companyId ?? undefined,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
      }),
    enabled: courseId > 0 && studentId > 0 && companyId !== null && companyId > 0,
  })
}
