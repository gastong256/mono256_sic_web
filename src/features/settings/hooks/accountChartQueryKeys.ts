export const accountChartQueryKeys = {
  root: ['account-chart'] as const,
  config: (teacherId?: number) => ['account-chart', 'config', teacherId ?? 'self'] as const,
}
