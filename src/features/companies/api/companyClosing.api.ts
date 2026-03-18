import { httpClient } from '@/shared/lib/http'
import {
  normalizeClosingSnapshotPayload,
  normalizeClosingExecutePayload,
  normalizeLogicalExercisesPayload,
  normalizeClosingPreviewPayload,
  normalizeClosingStatePayload,
} from '@/features/companies/adapters/closing.adapters'
import type {
  ClosingSnapshot,
  ClosingState,
  SimplifiedClosingExecuteResponse,
  SimplifiedClosingPreview,
  SimplifiedClosingRequest,
} from '@/features/companies/types/closing.types'
import type { LogicalExerciseListResponse } from '@/features/companies/types/logicalExercises.types'

export const companyClosingApi = {
  state: (companyId: number): Promise<ClosingState> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/closing/state/`)
      .then((response) => normalizeClosingStatePayload(response.data)),

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

  snapshot: (companyId: number, snapshotId: number): Promise<ClosingSnapshot> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/closing/snapshots/${snapshotId}/`)
      .then((response) => normalizeClosingSnapshotPayload(response.data)),
}
