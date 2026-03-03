import type { Company } from '@/features/companies/types/company.types'

interface CompanyTableProps {
  companies: Company[]
  showOwner?: boolean
  onView: (company: Company) => void
  onEdit: (company: Company) => void
  onDelete: (company: Company) => void
}

export function CompanyTable({
  companies,
  showOwner = false,
  onView,
  onEdit,
  onDelete,
}: CompanyTableProps) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 border-b border-[var(--border-soft)] bg-[var(--bg-subtle)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                CUIT
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Fecha de alta
              </th>
              {showOwner && (
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                  Propietario
                </th>
              )}
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-soft)]">
            {companies.map((company) => (
              <tr
                key={company.id}
                className="transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-[var(--bg-subtle)]"
              >
                <td className="px-4 py-3 font-medium text-[var(--text-strong)]">{company.name}</td>
                <td className="muted-text px-4 py-3">{company.tax_id ?? '—'}</td>
                <td className="muted-text px-4 py-3">
                  {new Date(company.created_at).toLocaleDateString('es-AR')}
                </td>
                {showOwner && <td className="muted-text px-4 py-3">{company.owner_username}</td>}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* Ver */}
                    <button
                      onClick={() => onView(company)}
                      className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white hover:text-[var(--brand-600)]"
                      aria-label={`Ver ${company.name}`}
                      title="Ver empresa"
                    >
                      <svg
                        className="size-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                        <path
                          fillRule="evenodd"
                          d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {/* Editar */}
                    <button
                      onClick={() => onEdit(company)}
                      className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white hover:text-amber-600"
                      aria-label={`Editar ${company.name}`}
                      title="Editar empresa"
                    >
                      <svg
                        className="size-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M5.433 13.917l1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                      </svg>
                    </button>
                    {/* Eliminar */}
                    <button
                      onClick={() => onDelete(company)}
                      className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white hover:text-red-600"
                      aria-label={`Eliminar ${company.name}`}
                      title="Eliminar empresa"
                    >
                      <svg
                        className="size-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C9.327 4.025 10.168 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
