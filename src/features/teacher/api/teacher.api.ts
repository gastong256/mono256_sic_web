import { httpClient } from '@/shared/lib/http'
import type { Company } from '@/features/companies/types/company.types'
import type { JournalEntryDetail } from '@/features/journal/types/journal.types'
import type { TeacherDashboardResponse } from '@/shared/types'

export const teacherApi = {
  dashboard: (): Promise<TeacherDashboardResponse> =>
    httpClient.get<TeacherDashboardResponse>('/teacher/dashboard/').then((r) => r.data),

  studentCompanies: (studentId: number): Promise<Company[]> =>
    httpClient.get<Company[]>(`/teacher/students/${studentId}/companies/`).then((r) => r.data),

  createStudentCompany: (
    studentId: number,
    payload: { name: string; tax_id?: string }
  ): Promise<Company> =>
    httpClient
      .post<Company>(`/teacher/students/${studentId}/companies/`, payload)
      .then((r) => r.data),

  companyJournal: (companyId: number): Promise<JournalEntryDetail[]> =>
    httpClient
      .get<JournalEntryDetail[]>(`/teacher/companies/${companyId}/journal/`)
      .then((r) => r.data),
}
