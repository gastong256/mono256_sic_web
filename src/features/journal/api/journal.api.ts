import { httpClient } from '@/shared/lib/http'
import type {
  JournalEntry,
  JournalEntryDetail,
  CreateJournalEntryPayload,
  ReverseJournalEntryPayload,
} from '@/features/journal/types/journal.types'
import { fetchAllPages } from '@/shared/lib/fetchAllPages'
import {
  normalizeJournalEntryDetailPayload,
  normalizeJournalEntryListPayload,
} from '@/features/journal/adapters/journal.adapters'

export const journalApi = {
  list: (companyId: number): Promise<JournalEntry[]> =>
    fetchAllPages<unknown>((page) =>
      httpClient
        .get<unknown>(`/companies/${companyId}/journal/`, { params: { page } })
        .then((r) => r.data)
    ).then((entries) => normalizeJournalEntryListPayload(entries)),

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
