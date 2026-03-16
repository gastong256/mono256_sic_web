export const accountChartQueryKeys = {
  root: ['account-chart'] as const,
  bootstrap: (teacherId?: number) => ['account-chart', 'bootstrap', teacherId ?? 'self'] as const,
  config: (teacherId?: number) => ['account-chart', 'config', teacherId ?? 'self'] as const,
}
