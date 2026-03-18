import { useMutation } from '@tanstack/react-query'
import { companyClosingApi } from '@/features/companies/api/companyClosing.api'
import { logger } from '@/shared/lib/logger'
import type { SimplifiedClosingRequest } from '@/features/companies/types/closing.types'

export function usePreviewClosing(companyId: number) {
  return useMutation({
    mutationFn: (payload: SimplifiedClosingRequest) =>
      companyClosingApi.preview(companyId, payload),
    onSuccess: (preview) => {
      logger.info({
        message: 'Closing preview generated',
        companyId,
        closingDate: preview.closing_date,
      })
    },
    onError: (error) => {
      logger.error({ message: 'Failed to preview closing', companyId, error })
    },
  })
}
