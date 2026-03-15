import { extractApiMessage, extractFieldValidationErrors } from '@/shared/lib/httpErrors'

export function resolveFormApiError<TField extends string>(
  error: unknown,
  fields: readonly TField[],
  fallbackMessage: string
): { field: TField; message: string } | string {
  const fieldErrors = extractFieldValidationErrors(error)

  for (const field of fields) {
    const message = fieldErrors[field]
    if (message) return { field, message }
  }

  return extractApiMessage(error) ?? fallbackMessage
}
