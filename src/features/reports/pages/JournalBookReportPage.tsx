import { useMemo, useState } from 'react'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useJournalBookReport } from '@/features/reports/hooks/useJournalBookReport'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function formatAmount(value: string | number) {
  const amount = typeof value === 'number' ? value : Number(value)
  return arsFormatter.format(Number.isFinite(amount) ? amount : 0)
}

export function JournalBookReportPage() {
  const { activeCompanyId } = useActiveCompanyStore()
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')
  const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string }>({})

  const hasInvalidRange = useMemo(
    () => Boolean(dateFromInput && dateToInput && dateFromInput > dateToInput),
    [dateFromInput, dateToInput]
  )

  const { data, isLoading, isError, error } = useJournalBookReport(activeCompanyId, filters)

  const canSearch = !hasInvalidRange && activeCompanyId !== null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Libro Diario"
        subtitle="Consulta asientos cronologicos y sus lineas de doble entrada."
      />

      <section className="filter-panel p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-sm font-semibold text-[var(--text-muted)]">
            Desde
            <input
              type="date"
              value={dateFromInput}
              onChange={(e) => setDateFromInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-2 py-1.5 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
            />
          </label>
          <label className="text-sm font-semibold text-[var(--text-muted)]">
            Hasta
            <input
              type="date"
              value={dateToInput}
              onChange={(e) => setDateToInput(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-2 py-1.5 focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
            />
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <Button
              type="button"
              disabled={!canSearch}
              onClick={() =>
                setFilters({
                  dateFrom: dateFromInput || undefined,
                  dateTo: dateToInput || undefined,
                })
              }
            >
              Aplicar filtros
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDateFromInput('')
                setDateToInput('')
                setFilters({})
              }}
            >
              Limpiar
            </Button>
          </div>
        </div>
        {hasInvalidRange && (
          <p className="mt-2 text-sm text-red-600">La fecha desde no puede ser mayor a hasta.</p>
        )}
      </section>

      {activeCompanyId === null && (
        <Alert tone="warning">Selecciona una empresa para ver el Libro Diario.</Alert>
      )}

      {activeCompanyId !== null && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando libro diario..." />
        </div>
      )}

      {activeCompanyId !== null && isError && !isLoading && (
        <Alert tone="error">
          {error instanceof Error ? error.message : 'No se pudo cargar el Libro Diario.'}
        </Alert>
      )}

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <section className="space-y-4">
          <div className="glass-panel rounded-xl p-3 text-sm">
            <p className="font-semibold text-[var(--text-strong)]">Resumen del periodo</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="metric-chip">Asientos: {data.entries.length}</span>
              <span className="metric-chip">Debe: {formatAmount(data.grand_total_debit)}</span>
              <span className="metric-chip">Haber: {formatAmount(data.grand_total_credit)}</span>
            </div>
          </div>

          {data.entries.length === 0 ? (
            <EmptyState
              title="Sin resultados en el periodo"
              description="No hay asientos para los filtros seleccionados."
              className="py-8"
            />
          ) : (
            <ul className="space-y-3">
              {data.entries.map((entry) => (
                <li key={entry.id} className="ui-fade-in ui-lift data-table-shell">
                  <div className="data-table-head flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] px-3 py-2 text-sm">
                    <span className="font-semibold text-[var(--text-strong)]">
                      Asiento #{entry.entry_number} · {entry.date} · {entry.description}
                    </span>
                    <span className="font-medium text-[var(--text-muted)]">
                      Debe {formatAmount(entry.total_debit)} | Haber{' '}
                      {formatAmount(entry.total_credit)}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="data-table-head">
                        <tr className="text-left">
                          <th scope="col" className="px-3 py-2">
                            Cuenta
                          </th>
                          <th scope="col" className="px-3 py-2 text-right">
                            Debe
                          </th>
                          <th scope="col" className="px-3 py-2 text-right">
                            Haber
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-soft)]">
                        {entry.lines.map((line, index) => (
                          <tr key={`${entry.id}-${index}`}>
                            <td className="px-3 py-2 text-[var(--text-strong)]">
                              {line.account_code} · {line.account_name}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-[var(--text-muted)]">
                              {line.type === 'DEBIT' ? formatAmount(line.amount) : '—'}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-[var(--text-muted)]">
                              {line.type === 'CREDIT' ? formatAmount(line.amount) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
