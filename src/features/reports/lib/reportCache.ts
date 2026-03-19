import type { Company } from '@/features/companies/types/company.types'

export interface ReportCacheConfig {
  staleTime: number
  gcTime: number
}

const NORMAL_REPORT_STALE_TIME_MS = 60 * 1000
const STABLE_REPORT_STALE_TIME_MS = 5 * 60 * 1000
const REPORT_GC_TIME_MS = 15 * 60 * 1000

export function getReportCacheConfig(company: Company | null | undefined): ReportCacheConfig {
  if (company?.is_demo || company?.is_read_only) {
    return {
      staleTime: STABLE_REPORT_STALE_TIME_MS,
      gcTime: REPORT_GC_TIME_MS,
    }
  }

  return {
    staleTime: NORMAL_REPORT_STALE_TIME_MS,
    gcTime: REPORT_GC_TIME_MS,
  }
}
