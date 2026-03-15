import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CourseCreatePayload } from '@/features/teacher/types/teacher.types'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'

export function useTeacherCoursesList() {
  return useQuery({
    queryKey: teacherQueryKeys.courses,
    queryFn: teacherApi.listCourses,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CourseCreatePayload) => teacherApi.createCourse(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: teacherQueryKeys.courses })
    },
  })
}
