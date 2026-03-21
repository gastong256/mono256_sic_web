import type { CSSProperties } from 'react'

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
  RESULT_CLOSING: 'Cierre de Resultados',
  PATRIMONIAL_CLOSING: 'Cierre Patrimonial',
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

export interface JournalSourceTone {
  shellStyle: CSSProperties
  headStyle: CSSProperties
  titleColor: string
  metaColor: string
  totalsColor: string
  scrollStyle: CSSProperties
  tableHeadStyle: CSSProperties
  rowTextColor?: string
  rowBgOdd: string
  rowBgEven: string
  rowAmountBgOdd: string
  rowAmountBgEven: string
}

export function getJournalSourceTone(sourceType: string): JournalSourceTone | null {
  switch (sourceType) {
    case 'OPENING':
      return {
        shellStyle: {
          borderColor: '#86d3bf',
          background: 'linear-gradient(180deg, #f3fffb, #dff6ee)',
          boxShadow: '0 20px 44px -30px rgba(13,148,136,0.52)',
        },
        headStyle: {
          borderBottomColor: '#7cccb6',
          background: 'linear-gradient(180deg, #d2f2e6, #bfe7d8)',
        },
        titleColor: '#0f5f59',
        metaColor: '#2b7a72',
        totalsColor: '#24655f',
        scrollStyle: { background: '#f6fffb' },
        tableHeadStyle: {
          background: 'linear-gradient(180deg, #d8f3ea, #ccebdd)',
          color: '#0f5f59',
        },
        rowTextColor: '#194b46',
        rowBgOdd: '#f3fffb',
        rowBgEven: '#eaf8f2',
        rowAmountBgOdd: '#ecfbf5',
        rowAmountBgEven: '#e1f3eb',
      }
    case 'REOPENING':
      return {
        shellStyle: {
          borderColor: '#b8e4d8',
          background: 'linear-gradient(180deg, #fbfffd, #edf8f3)',
          boxShadow: '0 18px 40px -30px rgba(16,185,129,0.28)',
        },
        headStyle: {
          borderBottomColor: '#b2ddd1',
          background: 'linear-gradient(180deg, #ebf8f2, #e1f3ec)',
        },
        titleColor: '#29655c',
        metaColor: '#4a8178',
        totalsColor: '#3b6f67',
        scrollStyle: { background: '#fcfffd' },
        tableHeadStyle: {
          background: 'linear-gradient(180deg, #edf8f2, #e4f2eb)',
          color: '#29655c',
        },
        rowTextColor: '#315a53',
        rowBgOdd: '#fbfffd',
        rowBgEven: '#f2faf6',
        rowAmountBgOdd: '#f4fbf7',
        rowAmountBgEven: '#ebf5ef',
      }
    case 'RESULT_CLOSING':
    case 'PATRIMONIAL_CLOSING':
      return {
        shellStyle: {
          borderColor: '#d5c3f2',
          background: 'linear-gradient(180deg, #fcfbff, #f1ebff)',
          boxShadow: '0 20px 44px -30px rgba(109,40,217,0.3)',
        },
        headStyle: {
          borderBottomColor: '#ccb4ed',
          background: 'linear-gradient(180deg, #efe8ff, #e5d9ff)',
        },
        titleColor: '#5a35a8',
        metaColor: '#7a59b8',
        totalsColor: '#6848ad',
        scrollStyle: { background: '#fdfcff' },
        tableHeadStyle: {
          background: 'linear-gradient(180deg, #ede4ff, #e3d8fb)',
          color: '#5a35a8',
        },
        rowTextColor: '#523b84',
        rowBgOdd: '#fcfbff',
        rowBgEven: '#f4efff',
        rowAmountBgOdd: '#f5f0ff',
        rowAmountBgEven: '#ede4ff',
      }
    default:
      return null
  }
}
