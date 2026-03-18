export const companyQueryKeys = {
  root: ['companies'] as const,
  closingState: (companyId: number) => ['companies', companyId, 'closing-state'] as const,
  logicalExercises: (companyId: number) => ['companies', companyId, 'logical-exercises'] as const,
  latestSnapshot: (companyId: number) =>
    ['companies', companyId, 'closing-snapshot', 'latest'] as const,
  snapshot: (companyId: number, snapshotId: number) =>
    ['companies', companyId, 'closing-snapshot', snapshotId] as const,
}
