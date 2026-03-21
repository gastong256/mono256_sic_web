import { httpClient } from '@/shared/lib/http'
import type {
  JournalEntryDetail,
  JournalEntryListResponse,
  CreateJournalEntryPayload,
  ReverseJournalEntryPayload,
} from '@/features/journal/types/journal.types'
import {
  normalizeJournalEntryDetailPayload,
  normalizeJournalEntryListResponsePayload,
} from '@/features/journal/adapters/journal.adapters'

export const journalApi = {
  list: (companyId: number, page = 1): Promise<JournalEntryListResponse> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/journal/`, { params: { page } })
      .then((r) => normalizeJournalEntryListResponsePayload(r.data)),

  get: (companyId: number, entryId: number): Promise<JournalEntryDetail> =>
    httpClient
      .get<unknown>(`/companies/${companyId}/journal/${entryId}/`)
      .then((r) => normalizeJournalEntryDetailPayload(r.data)),

  create: (companyId: number, payload: CreateJournalEntryPayload): Promise<JournalEntryDetail> =>
    httpClient
      .post<unknown>(`/companies/${companyId}/journal/`, payload)
      .then((r) => normalizeJournalEntryDetailPayload(r.data)),

  reverse: (
    companyId: number,
    entryId: number,
    payload: ReverseJournalEntryPayload = {}
  ): Promise<JournalEntryDetail> =>
    httpClient
      .post<unknown>(`/companies/${companyId}/journal/${entryId}/reverse/`, payload)
      .then((r) => normalizeJournalEntryDetailPayload(r.data)),
}
