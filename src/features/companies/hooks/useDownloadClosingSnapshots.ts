import { useMutation } from '@tanstack/react-query'
import { companyClosingApi } from '@/features/companies/api/companyClosing.api'

export function useDownloadLatestClosingSnapshot() {
  return useMutation({
    mutationFn: ({ companyId }: { companyId: number }) =>
      companyClosingApi.downloadLatestSnapshotXlsx(companyId),
  })
}

export function useDownloadClosingSnapshot() {
  return useMutation({
    mutationFn: ({ companyId, snapshotId }: { companyId: number; snapshotId: number }) =>
      companyClosingApi.downloadSnapshotXlsx(companyId, snapshotId),
  })
}
