import { httpClient } from '@/shared/lib/http'
import type { AccountLevelConfig } from '@/shared/types'

export const accountChartApi = {
  getConfig: (): Promise<AccountLevelConfig[]> =>
    httpClient.get<AccountLevelConfig[]>('/account-chart/config/').then((r) => r.data),

  updateConfig: (payload: AccountLevelConfig[]): Promise<AccountLevelConfig[]> =>
    httpClient
      .patch<AccountLevelConfig[]>('/account-chart/config/', { items: payload })
      .then((r) => r.data),
}
