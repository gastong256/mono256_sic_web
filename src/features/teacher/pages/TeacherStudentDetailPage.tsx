import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useTeacherStudentCompanies } from '@/features/teacher/hooks/useTeacherStudentCompanies'
import { useTeacherCompanyJournalEntries } from '@/features/teacher/hooks/useTeacherCompanyJournalEntries'
import { Spinner } from '@/shared/ui/Spinner'
import type { JournalEntryDetail, JournalLine } from '@/features/journal/types/journal.types'

const arsFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

function parseAmount(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function summarizeByAccount(entries: JournalEntryDetail[]) {
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
  return arsFormatter.format(parseAmount(line.amount))
}

export function TeacherStudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const parsedStudentId = Number(studentId)

  const { data: companies = [], isLoading, error } = useTeacherStudentCompanies(parsedStudentId)

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)

  const {
    data: journalEntries = [],
    isLoading: journalLoading,
    error: journalError,
  } = useTeacherCompanyJournalEntries(selectedCompanyId)

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedCompanyId) ?? null,
    [companies, selectedCompanyId]
  )
  const companySummary = useMemo(() => {
    const totalDebit = journalEntries.reduce((sum, entry) => sum + entry.total_debit, 0)
    const totalCredit = journalEntries.reduce((sum, entry) => sum + entry.total_credit, 0)
    return {
      entries: journalEntries.length,
      totalDebit,
      totalCredit,
      balanceDiff: totalDebit - totalCredit,
      byAccount: summarizeByAccount(journalEntries),
    }
  }, [journalEntries])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Detalle de alumno</h1>
        <p className="mt-1 text-sm text-gray-500">Alumno #{parsedStudentId}</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Empresas del alumno</h2>

        {isLoading && <Spinner className="size-6 text-blue-600" label="Cargando empresas…" />}

        {error && !isLoading && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            Error al cargar las empresas del alumno.
          </div>
        )}

        {!isLoading && !error && companies.length === 0 && (
          <p className="text-sm text-gray-500">Este alumno aún no tiene empresas.</p>
        )}

        {!isLoading && !error && companies.length > 0 && (
          <ul className="space-y-2">
            {companies.map((company) => (
              <li key={company.id}>
                <button
                  onClick={() => setSelectedCompanyId(company.id)}
                  className={[
                    'w-full rounded-md border px-3 py-2 text-left text-sm',
                    selectedCompanyId === company.id
                      ? 'border-blue-200 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {company.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Asientos del alumno</h2>
        </div>

        {!selectedCompany && (
          <p className="text-sm text-gray-500">Seleccioná una empresa para revisar los asientos.</p>
        )}

        {selectedCompany && journalLoading && (
          <Spinner className="size-6 text-blue-600" label="Cargando asientos…" />
        )}

        {selectedCompany && journalError && !journalLoading && (
          <div
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            Error al cargar asientos para {selectedCompany.name}.
          </div>
        )}

        {selectedCompany && !journalLoading && !journalError && journalEntries.length === 0 && (
          <p className="text-sm text-gray-500">No hay asientos registrados para esta empresa.</p>
        )}

        {selectedCompany && !journalLoading && !journalError && journalEntries.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-900">
                Resumen de {selectedCompany.name}
              </p>
              <div className="mt-2 grid gap-2 text-sm text-blue-900 sm:grid-cols-2 lg:grid-cols-4">
                <p>Asientos: {companySummary.entries}</p>
                <p>Debe total: {arsFormatter.format(companySummary.totalDebit)}</p>
                <p>Haber total: {arsFormatter.format(companySummary.totalCredit)}</p>
                <p
                  className={companySummary.balanceDiff === 0 ? 'text-emerald-700' : 'text-red-700'}
                >
                  Diferencia: {arsFormatter.format(companySummary.balanceDiff)}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                      Cuenta
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Debe</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                      Haber
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">
                      Saldo neto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companySummary.byAccount.map((account) => (
                    <tr key={account.code}>
                      <td className="px-3 py-2 text-gray-700">
                        {account.code} · {account.name}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {arsFormatter.format(account.debit)}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-700">
                        {arsFormatter.format(account.credit)}
                      </td>
                      <td
                        className={[
                          'px-3 py-2 text-right font-medium',
                          account.balance >= 0 ? 'text-emerald-700' : 'text-red-700',
                        ].join(' ')}
                      >
                        {arsFormatter.format(account.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3">
              {journalEntries.map((entry) => (
                <li key={entry.id} className="rounded-md border border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                    <span className="font-medium text-gray-800">
                      Asiento #{entry.entry_number} · {entry.date} · {entry.description}
                    </span>
                    <span
                      className={
                        entry.total_debit === entry.total_credit
                          ? 'text-emerald-700'
                          : 'text-red-700'
                      }
                    >
                      Debe {arsFormatter.format(entry.total_debit)} | Haber{' '}
                      {arsFormatter.format(entry.total_credit)}
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500">
                          <th className="px-3 py-2">Cuenta</th>
                          <th className="px-3 py-2 text-right">Debe</th>
                          <th className="px-3 py-2 text-right">Haber</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {entry.lines.map((line, index) => (
                          <tr key={`${entry.id}-${index}`}>
                            <td className="px-3 py-2 text-gray-700">
                              {line.account_code} · {line.account_name}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              {line.type === 'DEBIT' ? lineAmount(line) : '—'}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              {line.type === 'CREDIT' ? lineAmount(line) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
