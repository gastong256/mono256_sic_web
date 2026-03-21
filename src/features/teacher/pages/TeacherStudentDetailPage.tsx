import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useTeacherStudentContext } from '@/features/teacher/hooks/useTeacherStudentContext'
import { Spinner } from '@/shared/ui/Spinner'
import type { JournalLine } from '@/features/journal/types/journal.types'
import type { TeacherCourseJournalEntry } from '@/features/teacher/types/teacher.types'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { formatARSAmount } from '@/shared/lib/currency'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'
import { getCompanyStatusLabels } from '@/features/companies/lib/companyAccounting'

function parseAmount(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function summarizeByAccount(entries: TeacherCourseJournalEntry[]) {
  const summary = new Map<
    number,
    { code: string; name: string; debit: number; credit: number; balance: number }
  >()

  entries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const amount = parseAmount(line.amount)
      const debit = line.type === 'DEBIT' ? amount : 0
      const credit = line.type === 'CREDIT' ? amount : 0
      const previous = summary.get(line.account_id) ?? {
        code: line.account_code,
        name: line.account_name,
        debit: 0,
        credit: 0,
        balance: 0,
      }

      const next = {
        ...previous,
        debit: previous.debit + debit,
        credit: previous.credit + credit,
      }
      next.balance = next.debit - next.credit
      summary.set(line.account_id, next)
    })
  })

  return Array.from(summary.values()).sort((a, b) => a.code.localeCompare(b.code))
}

function lineAmount(line: JournalLine): string {
  return formatARSAmount(parseAmount(line.amount))
}

function entryTotals(entry: TeacherCourseJournalEntry): { debit: number; credit: number } {
  return entry.lines.reduce(
    (acc, line) => {
      const amount = parseAmount(line.amount)
      if (line.type === 'DEBIT') acc.debit += amount
      if (line.type === 'CREDIT') acc.credit += amount
      return acc
    },
    { debit: 0, credit: 0 }
  )
}

export function TeacherStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const parsedStudentId = Number(studentId)
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)

  const {
    data: context,
    isLoading,
    error,
    isFetching: journalLoading,
    error: journalError,
  } = useTeacherStudentContext(parsedStudentId, {
    companyId: selectedCompanyId,
    entriesLimit: 25,
  })
  const companies = useMemo(() => context?.companies ?? [], [context?.companies])
  const journalEntries = useMemo(() => context?.journal_entries ?? [], [context?.journal_entries])

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  )
  const companySummary = useMemo(() => {
    const totals = journalEntries.reduce(
      (acc, entry) => {
        const entryTotal = entryTotals(entry)
        acc.debit += entryTotal.debit
        acc.credit += entryTotal.credit
        return acc
      },
      { debit: 0, credit: 0 }
    )
    return {
      entries: journalEntries.length,
      totalDebit: totals.debit,
      totalCredit: totals.credit,
      balanceDiff: totals.debit - totals.credit,
      byAccount: summarizeByAccount(journalEntries),
    }
  }, [journalEntries])
  const companiesErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudieron cargar las empresas del alumno.',
        forbiddenMessage: 'No tenés permisos para ver empresas de este alumno.',
        notFoundMessage: 'El alumno o el curso ya no existe.',
      }),
    [error]
  )
  const journalErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(journalError, {
        defaultMessage: 'No se pudieron cargar los asientos del alumno.',
        badRequestMessage: 'Parámetros inválidos para consultar los asientos.',
        forbiddenMessage: 'No tenés permisos para ver estos asientos.',
        notFoundMessage: 'La empresa seleccionada no existe o ya no está disponible.',
      }),
    [journalError]
  )

  return (
    <div className="page-shell">
      <PageHeader
        icon="student"
        title="Detalle de alumno"
        subtitle={
          context?.student.full_name
            ? `${context.student.full_name} · ${context.student.course_name || 'Sin curso'}`
            : `Alumno #${parsedStudentId}`
        }
      />

      {!isLoading && !error && companies.length > 0 && (
        <section className="grid gap-3 md:grid-cols-3">
          <article className="summary-stat-card">
            <p className="summary-stat-label">Empresas</p>
            <p className="summary-stat-value">{companies.length}</p>
          </article>
          <article className="summary-stat-card">
            <p className="summary-stat-label">Empresa seleccionada</p>
            <p className="summary-stat-value text-[0.95rem]">
              {selectedCompany?.name || 'Ninguna'}
            </p>
          </article>
          <article className="summary-stat-card">
            <p className="summary-stat-label">Asientos visibles</p>
            <p className="summary-stat-value">{journalEntries.length}</p>
          </article>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="page-section h-fit">
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-strong)]">
            Empresas del alumno
          </h2>

          {isLoading && <Spinner className="size-6 text-blue-600" label="Cargando empresas…" />}

          {error && !isLoading && <Alert tone="error">{companiesErrorMessage}</Alert>}

          {!isLoading && !error && companies.length === 0 && (
            <EmptyState
              icon="companies"
              title="Este alumno aun no tiene empresas"
              className="border-none py-6"
            />
          )}

          {!isLoading && !error && companies.length > 0 && (
            <ul className="space-y-2">
              {companies.map((company) => (
                <li key={company.id}>
                  <button
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={[
                      'w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                      selectedCompanyId === company.id
                        ? 'border-[var(--brand-500)] bg-[var(--bg-subtle)] text-[var(--brand-700)]'
                        : 'border-[var(--border-soft)] text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
                    ].join(' ')}
                  >
                    <span className="block font-semibold">{company.name}</span>
                    {company.is_demo && company.demo_slug && (
                      <span className="muted-text mt-1 block text-xs">
                        Demo: {company.demo_slug}
                      </span>
                    )}
                    {getCompanyStatusLabels(company).length > 0 && (
                      <span className="muted-text mt-1 block text-xs">
                        {getCompanyStatusLabels(company).join(' · ')}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="page-section">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-strong)]">Asientos del alumno</h2>
          </div>

          {!selectedCompany && (
            <EmptyState
              icon="companies"
              title="Selecciona una empresa"
              description="Necesitas una empresa seleccionada para revisar los asientos del alumno."
              className="border-none py-6"
            />
          )}

          {selectedCompany && journalLoading && (
            <Spinner className="size-6 text-blue-600" label="Cargando asientos…" />
          )}

          {selectedCompany && journalError && !journalLoading && (
            <Alert tone="error">
              {journalErrorMessage} ({selectedCompany.name}).
            </Alert>
          )}

          {selectedCompany && !journalLoading && !journalError && journalEntries.length === 0 && (
            <>
              {selectedCompany.accounting_ready === false && (
                <Alert tone="warning">
                  Esta empresa todavía no tiene apertura contable. Por eso aún no muestra actividad
                  operativa.
                </Alert>
              )}
              <EmptyState
                icon="journal"
                title="No hay asientos registrados"
                description="Esta empresa todavia no tiene actividad contable."
                className="border-none py-6"
              />
            </>
          )}

          {selectedCompany && !journalLoading && !journalError && journalEntries.length > 0 && (
            <div className="space-y-4">
              <div className="subtle-panel p-3.5">
                <p className="text-sm font-semibold text-[var(--text-strong)]">
                  Resumen contable de {selectedCompany.name}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <article className="summary-stat-card">
                    <p className="summary-stat-label">Asientos</p>
                    <p className="summary-stat-value">{companySummary.entries}</p>
                  </article>
                  <article className="summary-stat-card">
                    <p className="summary-stat-label">Debe total</p>
                    <p className="summary-stat-value text-[#145f91]">
                      {formatARSAmount(companySummary.totalDebit)}
                    </p>
                  </article>
                  <article className="summary-stat-card">
                    <p className="summary-stat-label">Haber total</p>
                    <p className="summary-stat-value text-[#8f4b12]">
                      {formatARSAmount(companySummary.totalCredit)}
                    </p>
                  </article>
                  <article className="summary-stat-card">
                    <p className="summary-stat-label">Diferencia</p>
                    <p
                      className={[
                        'summary-stat-value',
                        companySummary.balanceDiff === 0 ? 'text-emerald-700' : 'text-red-700',
                      ].join(' ')}
                    >
                      {formatARSAmount(companySummary.balanceDiff)}
                    </p>
                  </article>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                  Resumen por cuenta
                </h3>
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
                          <th scope="col" className="amount-col">
                            Saldo neto
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {companySummary.byAccount.map((account) => (
                          <tr key={account.code}>
                            <td>
                              {account.code} · {account.name}
                            </td>
                            <td className="amount-cell amount-cell-debit">
                              {formatARSAmount(account.debit)}
                            </td>
                            <td className="amount-cell amount-cell-credit">
                              {formatARSAmount(account.credit)}
                            </td>
                            <td
                              className={[
                                'amount-cell',
                                account.balance >= 0 ? 'text-emerald-700' : 'text-red-700',
                              ].join(' ')}
                            >
                              {formatARSAmount(account.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <h3 className="text-sm font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Detalle de asientos
              </h3>
              <ul className="space-y-3">
                {journalEntries.map((entry) => {
                  const totals = entryTotals(entry)
                  const balanced = totals.debit === totals.credit

                  return (
                    <li key={entry.id} className="accounting-table-shell">
                      <div className="data-table-head flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-soft)] px-3 py-2 text-sm">
                        <span className="font-medium text-[var(--text-strong)]">
                          Asiento #{entry.entry_number} · {entry.date} · {entry.description}
                        </span>
                        <span
                          className={[
                            'entry-inline-totals',
                            balanced ? 'text-emerald-700' : 'text-red-700',
                          ].join(' ')}
                        >
                          Debe {formatARSAmount(totals.debit)} | Haber{' '}
                          {formatARSAmount(totals.credit)}
                        </span>
                      </div>
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
                            {entry.lines.map((line, index) => (
                              <tr key={`${entry.id}-${index}`}>
                                <td>
                                  {line.account_code} · {line.account_name}
                                </td>
                                <td
                                  className={
                                    line.type === 'DEBIT'
                                      ? 'amount-cell amount-cell-debit'
                                      : 'amount-cell-empty'
                                  }
                                >
                                  {line.type === 'DEBIT' ? lineAmount(line) : '—'}
                                </td>
                                <td
                                  className={
                                    line.type === 'CREDIT'
                                      ? 'amount-cell amount-cell-credit'
                                      : 'amount-cell-empty'
                                  }
                                >
                                  {line.type === 'CREDIT' ? lineAmount(line) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td>Total asiento</td>
                              <td className="amount-cell">{formatARSAmount(totals.debit)}</td>
                              <td className="amount-cell">{formatARSAmount(totals.credit)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
