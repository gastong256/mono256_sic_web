import { httpClient } from '@/shared/lib/http'
import {
  normalizeClosingExecutePayload,
  normalizeClosingPreviewPayload,
  normalizeClosingStatePayload,
} from '@/features/companies/adapters/closing.adapters'
import type {
  ClosingState,
  SimplifiedClosingExecuteResponse,
  SimplifiedClosingPreview,
  SimplifiedClosingRequest,
} from '@/features/companies/types/closing.types'

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
}
