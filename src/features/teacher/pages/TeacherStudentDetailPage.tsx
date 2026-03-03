import { useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { useTeacherStudentCompanies } from '@/features/teacher/hooks/useTeacherStudentCompanies'
import { useTeacherCompanyJournalEntries } from '@/features/teacher/hooks/useTeacherCompanyJournalEntries'
import { Spinner } from '@/shared/ui/Spinner'

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
          <p className="text-sm text-gray-500">Seleccioná una empresa para ver y crear asientos.</p>
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
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-100">
            {journalEntries.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-gray-700">
                  #{entry.entry_number} · {entry.date} · {entry.description}
                </span>
                <span className="font-medium text-gray-900">
                  {entry.total_debit.toLocaleString('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
