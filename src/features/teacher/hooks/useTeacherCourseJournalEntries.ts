import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'

export function useTeacherCourseJournalEntries(
  courseId: number,
  params?: { dateFrom?: string; dateTo?: string; studentId?: number; companyId?: number }
) {
  return useQuery({
    queryKey: teacherQueryKeys.courseJournalEntries(courseId, params),
    queryFn: () =>
      teacherApi.courseJournalEntries(courseId, {
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        studentId: params?.studentId,
        companyId: params?.companyId,
      }),
    enabled: courseId > 0,
    staleTime: 60_000,
  })
}
