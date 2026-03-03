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
    <div className="surface-card overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[var(--bg-subtle)]"
      >
        <div className="flex items-center gap-4">
          <span className="muted-text text-sm font-medium tabular-nums">{entry.date}</span>
          <span className="font-medium text-[var(--text-strong)]">{entry.description}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden text-right sm:block">
            <p className="muted-text text-xs">Debe</p>
            <p className="text-sm font-semibold text-[var(--text-strong)]">
              {formatARS(String(totalDebe))}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="muted-text text-xs">Haber</p>
            <p className="text-sm font-semibold text-[var(--text-strong)]">
              {formatARS(String(totalHaber))}
            </p>
          </div>
          {/* Chevron */}
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
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                  <th className="pb-2">Cuenta</th>
                  <th className="pb-2 text-right">Debe</th>
                  <th className="pb-2 text-right">Haber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {detail.lines.map((line, idx) => (
                  <tr key={`${line.account_id}-${idx}`}>
                    <td className="py-1.5 text-[var(--text-strong)]">
                      {line.account_code} - {line.account_name}
                    </td>
                    <td className="muted-text py-1.5 text-right tabular-nums">
                      {line.type === 'DEBIT' ? formatARS(line.amount) : '—'}
                    </td>
                    <td className="muted-text py-1.5 text-right tabular-nums">
                      {line.type === 'CREDIT' ? formatARS(line.amount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border-strong)] font-semibold">
                  <td className="muted-text pt-2">Total</td>
                  <td className="pt-2 text-right text-[var(--text-strong)] tabular-nums">
                    {formatARS(String(totalDebe))}
                  </td>
                  <td className="pt-2 text-right text-[var(--text-strong)] tabular-nums">
                    {formatARS(String(totalHaber))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
