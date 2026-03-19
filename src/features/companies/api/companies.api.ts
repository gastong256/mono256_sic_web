import { httpClient } from '@/shared/lib/http'
import type {
  Company,
  CreateCompanyPayload,
  OpeningEntryPayload,
  SetDemoPublicationPayload,
  UpdateCompanyPayload,
} from '@/features/companies/types/company.types'
import { fetchAllPages } from '@/shared/lib/fetchAllPages'
import { normalizeJournalEntryDetailPayload } from '@/features/journal/adapters/journal.adapters'
import type { JournalEntryDetail } from '@/features/journal/types/journal.types'

export const companiesApi = {
  list: (): Promise<Company[]> =>
    fetchAllPages<Company>((page) =>
      httpClient.get<unknown>('/companies/', { params: { page } }).then((r) => r.data)
    ),

  create: (payload: CreateCompanyPayload): Promise<Company> =>
    httpClient.post<Company>('/companies/', payload).then((r) => r.data),

  update: (id: number, payload: UpdateCompanyPayload): Promise<Company> =>
    httpClient.put<Company>(`/companies/${id}/`, payload).then((r) => r.data),

  setDemoPublication: (id: number, payload: SetDemoPublicationPayload): Promise<Company> =>
    httpClient.patch<Company>(`/companies/${id}/demo-publication/`, payload).then((r) => r.data),

  remove: (id: number): Promise<void> =>
    httpClient.delete(`/companies/${id}/`).then(() => undefined),

  createOpeningEntry: (
    companyId: number,
    payload: OpeningEntryPayload
  ): Promise<JournalEntryDetail> =>
    httpClient
      .post<unknown>(`/companies/${companyId}/opening-entry/`, payload)
      .then((r) => normalizeJournalEntryDetailPayload(r.data)),
}
