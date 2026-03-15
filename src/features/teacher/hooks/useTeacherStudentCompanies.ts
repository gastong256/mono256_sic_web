import { useQuery, useQueryClient } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'

export function useTeacherStudentCompanies(courseId: number, studentId: number) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: teacherQueryKeys.studentCompanies(courseId, studentId),
    queryFn: async () => {
      const summary = await queryClient.ensureQueryData({
        queryKey: teacherQueryKeys.courseCompaniesSummary(courseId),
        queryFn: () => teacherApi.courseCompaniesSummary(courseId),
      })
      return (
        summary.students.find((candidate) => candidate.student_id === studentId)?.companies ?? []
      )
    },
    enabled: courseId > 0 && studentId > 0,
  })
}
