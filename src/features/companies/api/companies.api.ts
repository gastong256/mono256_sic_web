import { httpClient } from '@/shared/lib/http'
import type {
  Company,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from '@/features/companies/types/company.types'
import { fetchAllPages } from '@/shared/lib/fetchAllPages'

export const companiesApi = {
  list: (): Promise<Company[]> =>
    fetchAllPages<Company>((page) =>
      httpClient.get<unknown>('/companies/', { params: { page } }).then((r) => r.data)
    ),

  get: (id: number): Promise<Company> =>
    httpClient.get<Company>(`/companies/${id}/`).then((r) => r.data),

  create: (payload: CreateCompanyPayload): Promise<Company> =>
    httpClient.post<Company>('/companies/', payload).then((r) => r.data),

  update: (id: number, payload: UpdateCompanyPayload): Promise<Company> =>
    httpClient.put<Company>(`/companies/${id}/`, payload).then((r) => r.data),

  remove: (id: number): Promise<void> =>
    httpClient.delete(`/companies/${id}/`).then(() => undefined),
}
