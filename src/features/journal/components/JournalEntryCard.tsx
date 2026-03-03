import { useState } from 'react'
import type { JournalEntry } from '@/features/journal/types/journal.types'
import { useJournalEntry } from '@/features/journal/hooks/useJournalEntry'
import { Spinner } from '@/shared/ui/Spinner'

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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500 tabular-nums">{entry.date}</span>
          <span className="font-medium text-gray-900">{entry.description}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden text-right sm:block">
            <p className="text-xs text-gray-400">Debe</p>
            <p className="text-sm font-medium text-gray-700">{formatARS(String(totalDebe))}</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs text-gray-400">Haber</p>
            <p className="text-sm font-medium text-gray-700">{formatARS(String(totalHaber))}</p>
          </div>
          {/* Chevron */}
          <svg
            className={[
              'size-4 text-gray-400 transition-transform',
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
        <div className="border-t border-gray-100 px-5 pt-3 pb-4">
          {detailLoading && (
            <div className="flex justify-center py-6">
              <Spinner className="size-5 text-blue-600" label="Cargando líneas…" />
            </div>
          )}

          {detailError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Error al cargar el detalle del asiento.
            </div>
          )}

          {!detailLoading && !detailError && detail && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="pb-2 font-medium">Cuenta</th>
                  <th className="pb-2 text-right font-medium">Debe</th>
                  <th className="pb-2 text-right font-medium">Haber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {detail.lines.map((line, idx) => (
                  <tr key={`${line.account_id}-${idx}`}>
                    <td className="py-1.5 text-gray-700">
                      {line.account_code} - {line.account_name}
                    </td>
                    <td className="py-1.5 text-right text-gray-600 tabular-nums">
                      {line.type === 'DEBIT' ? formatARS(line.amount) : '—'}
                    </td>
                    <td className="py-1.5 text-right text-gray-600 tabular-nums">
                      {line.type === 'CREDIT' ? formatARS(line.amount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 font-medium">
                  <td className="pt-2 text-gray-500">Total</td>
                  <td className="pt-2 text-right text-gray-700 tabular-nums">
                    {formatARS(String(totalDebe))}
                  </td>
                  <td className="pt-2 text-right text-gray-700 tabular-nums">
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
