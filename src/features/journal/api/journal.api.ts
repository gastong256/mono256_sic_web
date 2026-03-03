import { httpClient } from '@/shared/lib/http'
import type {
  JournalEntry,
  JournalEntryDetail,
  CreateJournalEntryPayload,
} from '@/features/journal/types/journal.types'

export const journalApi = {
  list: (companyId: number): Promise<JournalEntry[]> =>
    httpClient.get<JournalEntry[]>(`/companies/${companyId}/journal/`).then((r) => r.data),

  get: (companyId: number, entryId: number): Promise<JournalEntryDetail> =>
    httpClient
      .get<JournalEntryDetail>(`/companies/${companyId}/journal/${entryId}/`)
      .then((r) => r.data),

  create: (companyId: number, payload: CreateJournalEntryPayload): Promise<JournalEntryDetail> =>
    httpClient
      .post<JournalEntryDetail>(`/companies/${companyId}/journal/`, payload)
      .then((r) => r.data),
}
