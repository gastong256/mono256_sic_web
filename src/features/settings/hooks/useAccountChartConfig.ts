import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountChartApi } from '@/features/settings/api/accountChart.api'
import { accountQueryKeys } from '@/features/accounts/hooks/accountQueryKeys'
import { accountChartQueryKeys } from '@/features/settings/hooks/accountChartQueryKeys'
import type { AccountLevelConfig } from '@/shared/types'

export function useAccountChartConfig(options?: { teacherId?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: accountChartQueryKeys.config(options?.teacherId),
    queryFn: () => accountChartApi.getConfig({ teacherId: options?.teacherId }),
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useUpdateAccountChartConfig(options?: { teacherId?: number }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AccountLevelConfig[]) =>
      accountChartApi.updateConfig(payload, { teacherId: options?.teacherId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: accountChartQueryKeys.config(options?.teacherId),
        }),
        queryClient.invalidateQueries({ queryKey: accountQueryKeys.root }),
      ])
    },
  })
}
