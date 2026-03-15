import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'

export function useTeacherCourseCompaniesSummary(courseId: number) {
  return useQuery({
    queryKey: teacherQueryKeys.courseCompaniesSummary(courseId),
    queryFn: () => teacherApi.courseCompaniesSummary(courseId),
    enabled: courseId > 0,
    staleTime: 60_000,
  })
}
