export const journalQueryKeys = {
  root: ['journal'] as const,
  company: (companyId: number | null) => ['journal', companyId] as const,
  entries: (companyId: number | null) => ['journal', companyId, 'entries'] as const,
  entriesPage: (companyId: number | null, page: number) =>
    ['journal', companyId, 'entries', page] as const,
  entry: (companyId: number, entryId: number) => ['journal', companyId, 'entry', entryId] as const,
}
