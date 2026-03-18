export const NON_REVERSIBLE_JOURNAL_SOURCE_TYPES = [
  'OPENING',
  'ADJUSTMENT',
  'RESULT_CLOSING',
  'PATRIMONIAL_CLOSING',
  'REOPENING',
] as const

const JOURNAL_SOURCE_TYPE_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  OPENING: 'Apertura',
  REVERSAL: 'Reversa',
  ADJUSTMENT: 'Ajuste',
  RESULT_CLOSING: 'Cierre de resultados',
  PATRIMONIAL_CLOSING: 'Cierre patrimonial',
  REOPENING: 'Reapertura',
  INVOICE: 'Factura',
  RECEIPT: 'Recibo',
  OTHER: 'Otro',
}

export function getJournalSourceTypeLabel(sourceType: string): string {
  return JOURNAL_SOURCE_TYPE_LABELS[sourceType] ?? sourceType ?? '—'
}

export function isNonReversibleJournalSourceType(sourceType: string): boolean {
  return NON_REVERSIBLE_JOURNAL_SOURCE_TYPES.includes(
    sourceType as (typeof NON_REVERSIBLE_JOURNAL_SOURCE_TYPES)[number]
  )
}
