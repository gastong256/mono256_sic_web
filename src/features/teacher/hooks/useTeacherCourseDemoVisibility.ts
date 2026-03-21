import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherQueryKeys } from '@/features/teacher/hooks/teacherQueryKeys'
import type {
  TeacherCourseDemoCompaniesResponse,
  TeacherCourseDemoVisibilityPayload,
} from '@/features/teacher/types/teacher.types'

export function useTeacherCourseDemoCompanies(courseId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: teacherQueryKeys.courseDemoCompanies(courseId),
    queryFn: () => teacherApi.courseDemoCompanies(courseId),
    enabled: (options?.enabled ?? true) && courseId > 0,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

export function useSetTeacherCourseDemoVisibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      courseId,
      companyId,
      payload,
    }: {
      courseId: number
      companyId: number
      payload: TeacherCourseDemoVisibilityPayload
    }) => teacherApi.setCourseDemoVisibility(courseId, companyId, payload),
    onSuccess: async (updatedCompany, variables) => {
      queryClient.setQueryData<TeacherCourseDemoCompaniesResponse | undefined>(
        teacherQueryKeys.courseDemoCompanies(variables.courseId),
        (current) => {
          if (!current) return current
          return {
            ...current,
            demo_companies: current.demo_companies.map((company) =>
              company.company_id === updatedCompany.company_id ? updatedCompany : company
            ),
          }
        }
      )

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: teacherQueryKeys.coursesOverview }),
        queryClient.invalidateQueries({
          queryKey: teacherQueryKeys.courseCompaniesSummary(variables.courseId),
        }),
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey[0] === 'teacher' &&
            query.queryKey[1] === 'students',
        }),
      ])
    },
  })
}
