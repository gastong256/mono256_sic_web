import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CourseCreatePayload } from '@/features/teacher/types/teacher.types'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { TEACHER_DASHBOARD_QUERY_KEY } from '@/features/teacher/hooks/useTeacherDashboard'

export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CourseCreatePayload) => teacherApi.createCourse(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TEACHER_DASHBOARD_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ['teacher'] })
    },
  })
}
