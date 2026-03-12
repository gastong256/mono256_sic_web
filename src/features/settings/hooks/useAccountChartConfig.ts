import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountChartApi } from '@/features/settings/api/accountChart.api'
import type { AccountLevelConfig } from '@/shared/types'

export const ACCOUNT_CHART_CONFIG_QUERY_KEY = ['account-chart', 'config'] as const

export function useAccountChartConfig(options?: { teacherId?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: [...ACCOUNT_CHART_CONFIG_QUERY_KEY, options?.teacherId ?? 'self'] as const,
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
      await queryClient.invalidateQueries({
        queryKey: [...ACCOUNT_CHART_CONFIG_QUERY_KEY, options?.teacherId ?? 'self'] as const,
      })
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
