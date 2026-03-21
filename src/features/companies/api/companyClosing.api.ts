import { httpClient } from '@/shared/lib/http'
import { extractFilenameFromContentDisposition } from '@/shared/lib/fileDownload'
import {
  normalizeClosingSnapshotPayload,
  normalizeClosingExecutePayload,
  normalizeCurrentBookBalancesPayload,
  normalizeLogicalExercisesPayload,
  normalizeClosingPreviewPayload,
  normalizeClosingStatePayload,
} from '@/features/companies/adapters/closing.adapters'
import type {
  ClosingSnapshot,
  ClosingState,
  CurrentBookBalances,
  SimplifiedClosingExecuteResponse,
  SimplifiedClosingPreview,
  SimplifiedClosingRequest,
} from '@/features/companies/types/closing.types'
import type { LogicalExerciseListResponse } from '@/features/companies/types/logicalExercises.types'

type DownloadResponse = {
  blob: Blob
  filename: string | null
}

export const companyClosingApi = {
  state: (companyId: number): Promise<ClosingState> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/closing/state/`)
      .then((response) => normalizeClosingStatePayload(response.data)),

  currentBalances: (companyId: number, dateTo?: string): Promise<CurrentBookBalances> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/closing/current-balances/`, {
        params: dateTo ? { date_to: dateTo } : undefined,
      })
      .then((response) => normalizeCurrentBookBalancesPayload(response.data)),

  preview: (
    companyId: number,
    payload: SimplifiedClosingRequest
  ): Promise<SimplifiedClosingPreview> =>
    httpClient
      .post<unknown>(`/companies/${companyId}/closing/preview/`, payload)
      .then((response) => normalizeClosingPreviewPayload(response.data)),

  execute: (
    companyId: number,
    payload: SimplifiedClosingRequest
  ): Promise<SimplifiedClosingExecuteResponse> =>
    httpClient
      .post<unknown>(`/companies/${companyId}/closing/execute/`, payload)
      .then((response) => normalizeClosingExecutePayload(response.data)),

  logicalExercises: (companyId: number): Promise<LogicalExerciseListResponse> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/logical-exercises/`)
      .then((response) => normalizeLogicalExercisesPayload(response.data)),

  latestSnapshot: (companyId: number): Promise<ClosingSnapshot> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/closing/latest-snapshot/`)
      .then((response) => normalizeClosingSnapshotPayload(response.data)),

  downloadLatestSnapshotXlsx: (companyId: number): Promise<DownloadResponse> =>
    httpClient
      .get<Blob>(`/companies/${companyId}/closing/latest-snapshot.xlsx`, {
        responseType: 'blob',
      })
      .then((response) => ({
        blob: response.data,
        filename: extractFilenameFromContentDisposition(
          typeof response.headers['content-disposition'] === 'string'
            ? response.headers['content-disposition']
            : null
        ),
      })),

  snapshot: (companyId: number, snapshotId: number): Promise<ClosingSnapshot> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/closing/snapshots/${snapshotId}/`)
      .then((response) => normalizeClosingSnapshotPayload(response.data)),

  downloadSnapshotXlsx: (companyId: number, snapshotId: number): Promise<DownloadResponse> =>
    httpClient
      .get<Blob>(`/companies/${companyId}/closing/snapshots/${snapshotId}.xlsx`, {
        responseType: 'blob',
      })
      .then((response) => ({
        blob: response.data,
        filename: extractFilenameFromContentDisposition(
          typeof response.headers['content-disposition'] === 'string'
            ? response.headers['content-disposition']
            : null
        ),
      })),
}
