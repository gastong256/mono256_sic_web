import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  CompanyBooksClosedAlert,
  CompanyPendingOpeningState,
} from '@/features/companies/components/CompanyOperationalAlerts'
import { useActiveCompanyStore } from '@/features/companies/store/activeCompany.store'
import { useActiveCompany } from '@/features/companies/hooks/useActiveCompany'
import { ReportDateFilters } from '@/features/reports/components/ReportDateFilters'
import { useJournalBookReport } from '@/features/reports/hooks/useJournalBookReport'
import { useDownloadJournalBookReport } from '@/features/reports/hooks/useDownloadReports'
import {
  ReportExerciseInfo,
  ReportExercisePanel,
} from '@/features/reports/components/ReportExercisePanel'
import { getReportCacheConfig } from '@/features/reports/lib/reportCache'
import { getReportDownloadErrorMessage } from '@/features/reports/lib/downloadErrors'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { buildDefaultXlsxFilename, saveBlobAsFile } from '@/shared/lib/fileDownload'
import { formatARSAmount } from '@/shared/lib/currency'
import { useToast } from '@/shared/ui/ToastProvider'
import { extractFieldValidationErrors, getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { getJournalSourceTone, getJournalSourceTypeLabel } from '@/features/journal/lib/sourceTypes'

function getJournalBookEntryKey(entry: {
  entry_number: number
  date: string
  source_type: string
  source_ref: string
  description: string
}) {
  return [
    entry.entry_number,
    entry.date,
    entry.source_type,
    entry.source_ref,
    entry.description,
  ].join('::')
}

export function JournalBookReportPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { activeCompanyId } = useActiveCompanyStore()
  const {
    activeCompany,
    canManageOpening,
    canWriteCompany,
    isAccountingReady,
    booksClosedUntil,
    accountingBlockMessage,
    isLoading: companyLoading,
  } = useActiveCompany()
  const [dateFromInput, setDateFromInput] = useState('')
  const [dateToInput, setDateToInput] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<{ dateFrom?: string; dateTo?: string }>({})
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const reportCacheConfig = useMemo(() => getReportCacheConfig(activeCompany), [activeCompany])

  const hasInvalidRange = useMemo(
    () => Boolean(dateFromInput && dateToInput && dateFromInput > dateToInput),
    [dateFromInput, dateToInput]
  )

  const { data, isLoading, isFetching, isError, error } = useJournalBookReport(
    activeCompanyId,
    filters,
    {
      enabled: activeCompanyId !== null && !companyLoading && isAccountingReady,
      ...reportCacheConfig,
    }
  )
  const downloadMutation = useDownloadJournalBookReport()
  const fieldErrors = useMemo(() => extractFieldValidationErrors(error), [error])
  const reportErrorMessage = useMemo(() => {
    if (fieldErrors.date_from) return fieldErrors.date_from
    if (fieldErrors.date_to) return fieldErrors.date_to

    return getHttpErrorMessage(error, {
      defaultMessage: 'No se pudo cargar el Libro Diario.',
      badRequestMessage: 'Revisá los filtros de fecha e intentá nuevamente.',
      unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
      forbiddenMessage: 'No tenés permisos para consultar este reporte.',
      notFoundMessage: 'La empresa no existe o ya no está disponible.',
      conflictMessage: !isAccountingReady ? (accountingBlockMessage ?? undefined) : undefined,
    })
  }, [accountingBlockMessage, error, fieldErrors.date_from, fieldErrors.date_to, isAccountingReady])

  const canSearch = !hasInvalidRange && activeCompanyId !== null
  const normalizedSearch = searchInput.trim().toLowerCase()
  const visibleEntries = useMemo(() => {
    if (!data) return []
    if (!normalizedSearch) return data.entries

    return data.entries.filter((entry) => {
      const entryNumber = String(entry.entry_number)
      const description = entry.description.toLowerCase()
      return entryNumber.includes(normalizedSearch) || description.includes(normalizedSearch)
    })
  }, [data, normalizedSearch])

  async function handleDownload() {
    if (activeCompanyId === null) return
    try {
      const result = await downloadMutation.mutateAsync({
        companyId: activeCompanyId,
        params: filters,
      })
      const filename = result.filename ?? buildDefaultXlsxFilename('libro-diario')
      saveBlobAsFile(result.blob, filename)
      pushToast('Descarga iniciada correctamente.', 'success')
    } catch (downloadError) {
      pushToast(getReportDownloadErrorMessage(downloadError), 'error')
    }
  }

  function applyExerciseRange(startDate: string, closingDate: string | null) {
    const nextFilters = {
      dateFrom: startDate,
      dateTo: closingDate ?? undefined,
    }
    setDateFromInput(nextFilters.dateFrom)
    setDateToInput(nextFilters.dateTo ?? '')
    setFilters(nextFilters)
  }

  useEffect(() => {
    if (!data) return

    const isDesktop =
      typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches

    const nextExpandedEntries = isDesktop
      ? new Set(data.entries.map((entry) => getJournalBookEntryKey(entry)))
      : new Set<string>()

    setExpandedEntries(nextExpandedEntries)
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        icon="book"
        title="Libro Diario"
        subtitle="Consulta asientos cronologicos y sus lineas de doble entrada."
        actions={
          <Button
            type="button"
            variant="secondary"
            className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            disabled={activeCompanyId === null || hasInvalidRange || !isAccountingReady}
            isLoading={downloadMutation.isPending}
            onClick={() => {
              void handleDownload()
            }}
          >
            Descargar Excel
          </Button>
        }
      />

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <ReportExercisePanel
          companyId={activeCompanyId}
          activeExercise={data.active_exercise}
          previousExercises={data.previous_exercises}
          onSelectExercise={(exercise) =>
            applyExerciseRange(exercise.start_date, exercise.closing_date)
          }
          onSelectSnapshot={(exercise) => {
            if (activeCompanyId === null || exercise.snapshot_id === null) return
            void navigate(`/reports/closing/snapshots/${exercise.snapshot_id}`)
          }}
        />
      )}

      <ReportDateFilters
        dateFrom={dateFromInput}
        dateTo={dateToInput}
        onDateFromChange={setDateFromInput}
        onDateToChange={setDateToInput}
        onApply={() =>
          setFilters({
            dateFrom: dateFromInput || undefined,
            dateTo: dateToInput || undefined,
          })
        }
        onClear={() => {
          setDateFromInput('')
          setDateToInput('')
          setSearchInput('')
          setFilters({})
        }}
        canApply={canSearch}
        hasInvalidRange={hasInvalidRange}
        gridClassName="md:grid-cols-6"
        actionsClassName="md:col-span-2"
        extraFields={
          <label className="field-label md:col-span-2">
            Buscar asiento
            <div className="relative mt-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
                <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M8.5 3.75a4.75 4.75 0 1 0 0 9.5 4.75 4.75 0 0 0 0-9.5ZM2.25 8.5a6.25 6.25 0 1 1 10.825 4.214l3.605 3.606a.75.75 0 1 1-1.06 1.06l-3.606-3.605A6.25 6.25 0 0 1 2.25 8.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="N° de asiento o descripción"
                className="field-control pr-3 pl-9"
              />
            </div>
          </label>
        }
      />

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <ReportExerciseInfo
          requestedRange={data.requested_range}
          exerciseRange={data.exercise_range}
          visibleRange={data.visible_range}
          activeExercise={data.active_exercise}
        />
      )}

      {activeCompanyId === null && (
        <Alert tone="warning">Selecciona una empresa para ver el Libro Diario.</Alert>
      )}

      {activeCompanyId !== null && (
        <CompanyPendingOpeningState
          company={activeCompany}
          icon="book"
          action={
            canManageOpening && canWriteCompany ? (
              <Button onClick={() => navigate(`/companies/${activeCompanyId}`)}>
                Registrar apertura
              </Button>
            ) : undefined
          }
          className="py-12"
        />
      )}

      <CompanyBooksClosedAlert booksClosedUntil={booksClosedUntil} />

      {activeCompanyId !== null && isLoading && (
        <div className="flex justify-center py-12">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando libro diario..." />
        </div>
      )}

      {activeCompanyId !== null && isError && !isLoading && (
        <Alert tone="error">{reportErrorMessage}</Alert>
      )}

      {activeCompanyId !== null && !isLoading && !isError && data && (
        <section className="space-y-4">
          {isFetching && (
            <Alert tone="info">Actualizando el Libro Diario con los filtros aplicados…</Alert>
          )}

          <div className="glass-panel rounded-xl p-3 text-sm">
            <p className="font-semibold text-[var(--text-strong)]">
              {data.company || 'Resumen del periodo'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="metric-chip">Desde: {data.date_from ?? '—'}</span>
              <span className="metric-chip">Hasta: {data.date_to ?? '—'}</span>
              {data.active_exercise && (
                <span className="metric-chip">
                  Ejercicio: #{data.active_exercise.exercise_index}
                </span>
              )}
              <span className="metric-chip">
                {normalizedSearch ? 'Coincidencias' : 'Asientos'}: {visibleEntries.length}
              </span>
              <span className="metric-chip">Debe: {formatARSAmount(data.grand_total_debit)}</span>
              <span className="metric-chip">Haber: {formatARSAmount(data.grand_total_credit)}</span>
            </div>
          </div>

          {data.entries.length === 0 ? (
            <EmptyState
              icon="book"
              title="Sin resultados en el periodo"
              description="No hay asientos para los filtros seleccionados."
              className="py-8"
            />
          ) : visibleEntries.length === 0 ? (
            <EmptyState
              icon="book"
              title="Sin coincidencias"
              description="No encontramos asientos del periodo actual que coincidan con esa búsqueda."
              className="py-8"
            />
          ) : (
            <ul className="space-y-3">
              {visibleEntries.map((entry) => {
                const sourceTone = getJournalSourceTone(entry.source_type)
                const entryKey = getJournalBookEntryKey(entry)
                const isExpanded = expandedEntries.has(entryKey)

                return (
                  <li
                    key={entryKey}
                    className="ui-fade-in ui-lift data-table-shell"
                    style={sourceTone?.shellStyle}
                  >
                    <div
                      className="data-table-head border-b border-[var(--border-soft)] px-3 py-2 text-sm"
                      style={sourceTone?.headStyle}
                    >
                      <button
                        type="button"
                        className="flex w-full appearance-none flex-wrap items-center justify-between gap-2 border-0 bg-transparent p-0 text-left"
                        onClick={() =>
                          setExpandedEntries((current) => {
                            const next = new Set(current)
                            if (next.has(entryKey)) {
                              next.delete(entryKey)
                            } else {
                              next.add(entryKey)
                            }
                            return next
                          })
                        }
                      >
                        <div>
                          <span
                            className="font-semibold"
                            style={{ color: sourceTone?.titleColor ?? 'var(--text-strong)' }}
                          >
                            Asiento #{entry.entry_number} · {entry.date} · {entry.description}
                          </span>
                          <p
                            className="mt-1 text-xs"
                            style={{ color: sourceTone?.metaColor ?? 'var(--text-muted)' }}
                          >
                            Origen {getJournalSourceTypeLabel(entry.source_type)} · Ref.{' '}
                            {entry.source_ref || '—'}
                          </p>
                        </div>
                        <span
                          className="entry-inline-totals"
                          style={{ color: sourceTone?.totalsColor ?? 'var(--text-muted)' }}
                        >
                          Debe {formatARSAmount(entry.total_debit)} | Haber{' '}
                          {formatARSAmount(entry.total_credit)}
                        </span>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="accounting-table-scroll" style={sourceTone?.scrollStyle}>
                        <table className="accounting-table">
                          <thead style={sourceTone?.tableHeadStyle}>
                            <tr
                              style={
                                sourceTone ? { color: sourceTone.tableHeadStyle.color } : undefined
                              }
                            >
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
                            {entry.lines.map((line, lineIndex) => (
                              <tr key={`${entry.entry_number}-${lineIndex}`}>
                                <td
                                  style={
                                    sourceTone
                                      ? {
                                          backgroundColor:
                                            lineIndex % 2 === 0
                                              ? sourceTone.rowBgOdd
                                              : sourceTone.rowBgEven,
                                          color: sourceTone.rowTextColor,
                                        }
                                      : undefined
                                  }
                                >
                                  {line.account_code} · {line.account_name}
                                </td>
                                <td
                                  className={
                                    line.debit !== null
                                      ? 'amount-cell amount-cell-debit'
                                      : 'amount-cell-empty'
                                  }
                                  style={
                                    sourceTone
                                      ? {
                                          backgroundColor:
                                            lineIndex % 2 === 0
                                              ? sourceTone.rowAmountBgOdd
                                              : sourceTone.rowAmountBgEven,
                                        }
                                      : undefined
                                  }
                                >
                                  {line.debit !== null ? formatARSAmount(line.debit) : '—'}
                                </td>
                                <td
                                  className={
                                    line.credit !== null
                                      ? 'amount-cell amount-cell-credit'
                                      : 'amount-cell-empty'
                                  }
                                  style={
                                    sourceTone
                                      ? {
                                          backgroundColor:
                                            lineIndex % 2 === 0
                                              ? sourceTone.rowAmountBgOdd
                                              : sourceTone.rowAmountBgEven,
                                        }
                                      : undefined
                                  }
                                >
                                  {line.credit !== null ? formatARSAmount(line.credit) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
