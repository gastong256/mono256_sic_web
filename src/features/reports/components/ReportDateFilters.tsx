import type { ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'

interface ReportDateFiltersProps {
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onApply: () => void
  onClear: () => void
  canApply: boolean
  hasInvalidRange: boolean
  extraFields?: ReactNode
  gridClassName?: string
  actionsClassName?: string
  applyLabel?: string
  clearLabel?: string
}

export function ReportDateFilters({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear,
  canApply,
  hasInvalidRange,
  extraFields,
  gridClassName = 'md:grid-cols-4',
  actionsClassName = '',
  applyLabel = 'Aplicar filtros',
  clearLabel = 'Limpiar',
}: ReportDateFiltersProps) {
  return (
    <section className="filter-panel p-4">
      <div className={['grid grid-cols-1 gap-3', gridClassName].join(' ')}>
        <label className="field-label">
          Desde
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => onDateFromChange(event.target.value)}
            className="field-control"
          />
        </label>
        <label className="field-label">
          Hasta
          <input
            type="date"
            value={dateTo}
            onChange={(event) => onDateToChange(event.target.value)}
            className="field-control"
          />
        </label>
        {extraFields}
        <div className={['flex items-end gap-2', actionsClassName].join(' ')}>
          <Button
            type="button"
            disabled={!canApply}
            className="whitespace-nowrap"
            onClick={onApply}
          >
            {applyLabel}
          </Button>
          <Button type="button" variant="secondary" className="whitespace-nowrap" onClick={onClear}>
            {clearLabel}
          </Button>
        </div>
      </div>
      {hasInvalidRange && (
        <p className="mt-2 text-sm text-red-600">La fecha desde no puede ser mayor a hasta.</p>
      )}
    </section>
  )
}
