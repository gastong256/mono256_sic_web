import { useMemo, useState } from 'react'
import type { JournalEntry } from '@/features/journal/types/journal.types'
import { useJournalEntry } from '@/features/journal/hooks/useJournalEntry'
import { useReverseJournalEntry } from '@/features/journal/hooks/useReverseJournalEntry'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useToast } from '@/shared/ui/ToastProvider'

const arsFormat = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })

function formatARS(value: string): string {
  const num = Number(value)
  return isNaN(num) ? value : arsFormat.format(num)
}

interface JournalEntryCardProps {
  entry: JournalEntry
  companyId: number
  isReadOnly?: boolean
}

export function JournalEntryCard({ entry, companyId, isReadOnly = false }: JournalEntryCardProps) {
  const { pushToast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [confirmReverseOpen, setConfirmReverseOpen] = useState(false)
  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorObj,
  } = useJournalEntry(companyId, entry.id, expanded)
  const detailLoadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(detailErrorObj, {
        defaultMessage: 'No se pudo cargar el detalle del asiento.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para ver el detalle de este asiento.',
        notFoundMessage: 'El asiento ya no existe.',
      }),
    [detailErrorObj]
  )

  const totalDebe = entry.total_debit
  const totalHaber = entry.total_credit
  const reverseMutation = useReverseJournalEntry(companyId)
  const canReverse =
    !isReadOnly && entry.source_type !== 'OPENING' && !entry.reversal_of_id && !entry.reversed_by_id

  async function handleReverseEntry() {
    try {
      await reverseMutation.mutateAsync({ entryId: entry.id })
      pushToast('Asiento reversado correctamente.', 'success')
      setConfirmReverseOpen(false)
      setExpanded(false)
    } catch (reverseError) {
      pushToast(
        getHttpErrorMessage(reverseError, {
          defaultMessage: 'No se pudo reversar el asiento.',
          badRequestMessage: 'No se puede reversar este asiento en el estado actual.',
          forbiddenMessage: 'No tenés permisos para reversar este asiento.',
          notFoundMessage: 'El asiento ya no existe.',
          conflictMessage:
            entry.source_type === 'OPENING'
              ? 'El asiento de apertura no puede reversarse desde este flujo.'
              : 'El asiento ya fue reversado previamente.',
        }),
        'error'
      )
    }
  }

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
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              disabled={!canReverse || reverseMutation.isPending}
              onClick={() => setConfirmReverseOpen(true)}
              className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              title={
                isReadOnly
                  ? 'Empresa en modo solo lectura'
                  : entry.source_type === 'OPENING'
                    ? 'La apertura contable no se reversa desde este flujo'
                    : undefined
              }
            >
              Reversar asiento
            </button>
          </div>

          {detailLoading && (
            <div className="flex justify-center py-6">
              <Spinner className="size-5 text-[var(--brand-500)]" label="Cargando lineas..." />
            </div>
          )}

          {detailError && <Alert tone="error">{detailLoadErrorMessage}</Alert>}

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

      <ConfirmDialog
        isOpen={confirmReverseOpen}
        onClose={() => setConfirmReverseOpen(false)}
        onConfirm={() => {
          void handleReverseEntry()
        }}
        title="Reversar asiento"
        message={
          <>
            ¿Desea reversar el asiento <strong>#{entry.entry_number}</strong> del día{' '}
            <strong>{entry.date}</strong>? Se generará un asiento inverso automáticamente.
          </>
        }
        confirmLabel="Reversar"
        isLoading={reverseMutation.isPending}
        variant="danger"
      />
    </div>
  )
}
