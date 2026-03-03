import { useMutation, useQueryClient } from '@tanstack/react-query'
import { teacherApi } from '@/features/teacher/api/teacher.api'
import { teacherStudentCompaniesQueryKey } from '@/features/teacher/hooks/useTeacherStudentCompanies'
import { logger } from '@/shared/lib/logger'

export function useCreateTeacherStudentCompany(studentId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { name: string; tax_id?: string }) =>
      teacherApi.createStudentCompany(studentId, payload),
    onSuccess: async (company) => {
      logger.info({
        message: 'Teacher created company for student',
        studentId,
        companyId: company.id,
      })
      await queryClient.invalidateQueries({ queryKey: teacherStudentCompaniesQueryKey(studentId) })
      await queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] })
    },
  })
}
