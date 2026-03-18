export const companyQueryKeys = {
  root: ['companies'] as const,
  closingState: (companyId: number) => ['companies', companyId, 'closing-state'] as const,
}
