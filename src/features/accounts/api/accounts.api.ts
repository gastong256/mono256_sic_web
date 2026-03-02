import { httpClient } from '@/shared/lib/http'
import type {
  Account,
  CreateAccountPayload,
  UpdateAccountPayload,
} from '@/features/accounts/types/account.types'

export const accountsApi = {
  getChart: (): Promise<Account[]> =>
    httpClient.get<Account[]>('/accounts/chart/').then((r) => r.data),

  getCompanyAccounts: (companyId: number): Promise<Account[]> =>
    httpClient.get<Account[]>(`/accounts/company/${companyId}/`).then((r) => r.data),

  createAccount: (companyId: number, payload: CreateAccountPayload): Promise<Account> =>
    httpClient.post<Account>(`/accounts/company/${companyId}/`, payload).then((r) => r.data),

  updateAccount: (
    companyId: number,
    accountId: number,
    payload: UpdateAccountPayload
  ): Promise<Account> =>
    httpClient
      .patch<Account>(`/accounts/company/${companyId}/${accountId}/`, payload)
      .then((r) => r.data),

  deleteAccount: (companyId: number, accountId: number): Promise<void> =>
    httpClient.delete(`/accounts/company/${companyId}/${accountId}/`).then(() => undefined),
}
