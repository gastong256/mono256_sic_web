import { useQuery } from '@tanstack/react-query'
import { companyClosingApi } from '@/features/companies/api/companyClosing.api'
import { companyQueryKeys } from '@/features/companies/hooks/companyQueryKeys'

export function useLatestClosingSnapshot(companyId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: companyQueryKeys.latestSnapshot(companyId),
    queryFn: () => companyClosingApi.latestSnapshot(companyId),
    enabled: (options?.enabled ?? true) && companyId > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

export function useClosingSnapshot(
  companyId: number,
  snapshotId: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: companyQueryKeys.snapshot(companyId, snapshotId),
    queryFn: () => companyClosingApi.snapshot(companyId, snapshotId),
    enabled: (options?.enabled ?? true) && companyId > 0 && snapshotId > 0,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60 * 1000,
  })
}
