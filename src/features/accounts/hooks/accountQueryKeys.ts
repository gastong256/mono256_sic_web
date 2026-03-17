export const accountQueryKeys = {
  root: ['accounts'] as const,
  chart: () => ['accounts', 'chart'] as const,
  company: (companyId: number) => ['accounts', 'company', companyId] as const,
  companyFlat: (companyId: number) => ['accounts', 'company', companyId, 'flat'] as const,
}
