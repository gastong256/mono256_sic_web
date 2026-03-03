import { useState } from 'react'
import type { JournalEntry } from '@/features/journal/types/journal.types'
import { useJournalEntry } from '@/features/journal/hooks/useJournalEntry'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'

const arsFormat = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

function formatARS(value: string): string {
  const num = Number(value)
  return isNaN(num) ? value : arsFormat.format(num)
}

interface JournalEntryCardProps {
  entry: JournalEntry
  companyId: number
}

export function JournalEntryCard({ entry, companyId }: JournalEntryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
  } = useJournalEntry(companyId, entry.id, expanded)

  const totalDebe = entry.total_debit
  const totalHaber = entry.total_credit

  return (
    <div className="surface-card ui-fade-in ui-lift overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-subtle)]"
      >
        <div className="flex items-center gap-4">
          <span className="muted-text text-sm font-medium tabular-nums">{entry.date}</span>
          <span className="font-medium text-[var(--text-strong)]">{entry.description}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="summary-stat-card hidden min-w-[9rem] text-right sm:block">
            <span className="summary-stat-label">Debe</span>
            <span className="summary-stat-value text-[0.9rem] text-[#145f91]">
              {formatARS(String(totalDebe))}
            </span>
          </span>
          <span className="summary-stat-card hidden min-w-[9rem] text-right sm:block">
            <span className="summary-stat-label">Haber</span>
            <span className="summary-stat-value text-[0.9rem] text-[#8f4b12]">
              {formatARS(String(totalHaber))}
            </span>
          </span>
          <span className="summary-stat-card min-w-[8.2rem] text-right sm:hidden">
            <span className="summary-stat-label">Debe/Haber</span>
            <span className="summary-stat-value text-[0.86rem]">
              {formatARS(String(totalDebe))} / {formatARS(String(totalHaber))}
            </span>
          </span>
          <svg
            className={[
              'muted-text size-4 transition-transform',
              expanded ? 'rotate-180' : '',
            ].join(' ')}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* Expanded lines */}
      {expanded && (
        <div className="border-t border-[var(--border-soft)] px-5 pt-3 pb-4">
          {detailLoading && (
            <div className="flex justify-center py-6">
              <Spinner className="size-5 text-[var(--brand-500)]" label="Cargando lineas..." />
            </div>
          )}

          {detailError && <Alert tone="error">Error al cargar el detalle del asiento.</Alert>}

          {!detailLoading && !detailError && detail && (
            <div className="accounting-table-shell">
              <div className="accounting-table-scroll">
                <table className="accounting-table">
                  <thead>
                    <tr>
                      <th scope="col">Cuenta</th>
                      <th scope="col" className="amount-col">
                        Debe
                      </th>
                      <th scope="col" className="amount-col">
                        Haber
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((line, idx) => (
                      <tr key={`${line.account_id}-${idx}`}>
                        <td>
                          {line.account_code} - {line.account_name}
                        </td>
                        <td
                          className={
                            line.type === 'DEBIT'
                              ? 'amount-cell amount-cell-debit'
                              : 'amount-cell-empty'
                          }
                        >
                          {line.type === 'DEBIT' ? formatARS(line.amount) : '—'}
                        </td>
                        <td
                          className={
                            line.type === 'CREDIT'
                              ? 'amount-cell amount-cell-credit'
                              : 'amount-cell-empty'
                          }
                        >
                          {line.type === 'CREDIT' ? formatARS(line.amount) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td className="amount-cell">{formatARS(String(totalDebe))}</td>
                      <td className="amount-cell">{formatARS(String(totalHaber))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
