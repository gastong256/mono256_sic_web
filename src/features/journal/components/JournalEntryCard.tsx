import { useMemo, useState } from 'react'
import type { JournalEntry } from '@/features/journal/types/journal.types'
import { useJournalEntry } from '@/features/journal/hooks/useJournalEntry'
import { useReverseJournalEntry } from '@/features/journal/hooks/useReverseJournalEntry'
import { formatARSAmount } from '@/shared/lib/currency'
import { Spinner } from '@/shared/ui/Spinner'
import { Alert } from '@/shared/ui/Alert'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { useToast } from '@/shared/ui/ToastProvider'
import {
  getJournalSourceTone,
  getJournalSourceTypeLabel,
  isNonReversibleJournalSourceType,
} from '@/features/journal/lib/sourceTypes'

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
    !isReadOnly &&
    !isNonReversibleJournalSourceType(entry.source_type) &&
    !entry.reversal_of_id &&
    !entry.reversed_by_id
  const sourceTone = getJournalSourceTone(entry.source_type)

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
          conflictMessage: isNonReversibleJournalSourceType(entry.source_type)
            ? `El asiento de ${getJournalSourceTypeLabel(entry.source_type).toLowerCase()} fue generado por un proceso del sistema y no puede reversarse.`
            : 'El asiento ya fue reversado previamente.',
        }),
        'error'
      )
    }
  }

  return (
    <div className="surface-card ui-fade-in ui-lift overflow-hidden" style={sourceTone?.shellStyle}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--bg-subtle)] sm:items-center"
        style={sourceTone ? { backgroundColor: 'transparent' } : undefined}
      >
        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <p className="muted-text text-sm font-medium tabular-nums">{entry.date}</p>
            <p
              className="mt-1 line-clamp-3 text-sm font-medium sm:line-clamp-2 sm:text-base"
              style={sourceTone ? { color: sourceTone.titleColor } : undefined}
            >
              {entry.description}
            </p>
            <p
              className="mt-1 text-xs"
              style={sourceTone ? { color: sourceTone.metaColor } : undefined}
            >
              {getJournalSourceTypeLabel(entry.source_type)} · Ref. {entry.source_ref || '—'}
            </p>
          </div>
        </div>
        <div className="flex w-[48%] shrink-0 items-center justify-end gap-2 sm:w-auto sm:gap-3">
          <span
            className="summary-stat-card hidden min-w-[9rem] text-right sm:block"
            style={{
              borderColor: '#cfdcf0',
              background: 'linear-gradient(180deg, #fafdff, #eef4ff)',
            }}
          >
            <span className="summary-stat-label">Debe</span>
            <span className="summary-stat-value text-[0.9rem] text-[#145f91]">
              {formatARSAmount(totalDebe)}
            </span>
          </span>
          <span
            className="summary-stat-card hidden min-w-[9rem] text-right sm:block"
            style={{
              borderColor: '#c9d5e4',
              background: 'linear-gradient(180deg, #f3f6fa, #e7edf5)',
            }}
          >
            <span className="summary-stat-label">Haber</span>
            <span className="summary-stat-value text-[0.9rem] text-[#8f4b12]">
              {formatARSAmount(totalHaber)}
            </span>
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:hidden">
            <span
              className="summary-stat-card min-w-0 overflow-hidden px-2.5 py-0.5 text-right"
              style={{
                borderColor: '#cfdcf0',
                background: 'linear-gradient(180deg, #fafdff, #eef4ff)',
              }}
            >
              <span className="summary-stat-label text-[0.62rem] leading-none">Debe</span>
              <span className="summary-stat-value block truncate text-[0.72rem] leading-none">
                {formatARSAmount(totalDebe)}
              </span>
            </span>
            <span
              className="summary-stat-card min-w-0 overflow-hidden px-2.5 py-0.5 text-right"
              style={{
                borderColor: '#c9d5e4',
                background: 'linear-gradient(180deg, #f3f6fa, #e7edf5)',
              }}
            >
              <span className="summary-stat-label text-[0.62rem] leading-none">Haber</span>
              <span className="summary-stat-value block truncate text-[0.72rem] leading-none">
                {formatARSAmount(totalHaber)}
              </span>
            </span>
          </div>
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
                  : isNonReversibleJournalSourceType(entry.source_type)
                    ? `Los asientos de ${getJournalSourceTypeLabel(entry.source_type).toLowerCase()} no se reversan desde este flujo`
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
                  <thead style={sourceTone?.tableHeadStyle}>
                    <tr style={sourceTone ? { color: sourceTone.tableHeadStyle.color } : undefined}>
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
                        <td
                          style={
                            sourceTone
                              ? {
                                  backgroundColor:
                                    idx % 2 === 0 ? sourceTone.rowBgOdd : sourceTone.rowBgEven,
                                  color: sourceTone.rowTextColor,
                                }
                              : undefined
                          }
                        >
                          {line.account_code} - {line.account_name}
                        </td>
                        <td
                          className={
                            line.type === 'DEBIT'
                              ? 'amount-cell amount-cell-debit'
                              : 'amount-cell-empty'
                          }
                          style={
                            sourceTone
                              ? {
                                  backgroundColor:
                                    idx % 2 === 0
                                      ? sourceTone.rowAmountBgOdd
                                      : sourceTone.rowAmountBgEven,
                                }
                              : undefined
                          }
                        >
                          {line.type === 'DEBIT' ? formatARSAmount(line.amount) : '—'}
                        </td>
                        <td
                          className={
                            line.type === 'CREDIT'
                              ? 'amount-cell amount-cell-credit'
                              : 'amount-cell-empty'
                          }
                          style={
                            sourceTone
                              ? {
                                  backgroundColor:
                                    idx % 2 === 0
                                      ? sourceTone.rowAmountBgOdd
                                      : sourceTone.rowAmountBgEven,
                                }
                              : undefined
                          }
                        >
                          {line.type === 'CREDIT' ? formatARSAmount(line.amount) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td className="amount-cell">{formatARSAmount(totalDebe)}</td>
                      <td className="amount-cell">{formatARSAmount(totalHaber)}</td>
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
