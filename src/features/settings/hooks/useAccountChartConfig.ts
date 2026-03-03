import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { accountChartApi } from '@/features/settings/api/accountChart.api'

export const ACCOUNT_CHART_CONFIG_QUERY_KEY = ['account-chart', 'config'] as const

export function useAccountChartConfig() {
  return useQuery({
    queryKey: ACCOUNT_CHART_CONFIG_QUERY_KEY,
    queryFn: accountChartApi.getConfig,
    staleTime: 60 * 1000,
  })
}

export function useUpdateAccountChartConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: accountChartApi.updateConfig,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNT_CHART_CONFIG_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
