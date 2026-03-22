import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Company } from '@/features/companies/types/company.types'
import { getCompanyStatusLabels } from '@/features/companies/lib/companyAccounting'
import { canViewerWriteCompany } from '@/features/companies/lib/companyWriteAccess'

interface CompanyTableProps {
  companies: Company[]
  showOwner?: boolean
  canManageDemoPublication?: boolean
  onToggleDemoPublication?: (company: Company) => void
  demoPublicationPendingId?: number | null
  onView: (company: Company) => void
  onEdit: (company: Company) => void
  onDelete: (company: Company) => void
}

export function CompanyTable({
  companies,
  showOwner = false,
  canManageDemoPublication = false,
  onToggleDemoPublication,
  demoPublicationPendingId = null,
  onView,
  onEdit,
  onDelete,
}: CompanyTableProps) {
  const [mobileActionsMenu, setMobileActionsMenu] = useState<{
    company: Company
    top: number
    left: number
  } | null>(null)

  useEffect(() => {
    if (!mobileActionsMenu) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileActionsMenu(null)
    }

    function handleViewportChange() {
      setMobileActionsMenu(null)
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [mobileActionsMenu])

  function openMobileActions(company: Company, trigger: HTMLButtonElement) {
    const rect = trigger.getBoundingClientRect()
    const menuWidth = 176
    const viewportPadding = 12
    const idealLeft = rect.right - menuWidth
    const left = Math.min(
      window.innerWidth - menuWidth - viewportPadding,
      Math.max(viewportPadding, idealLeft)
    )

    setMobileActionsMenu({
      company,
      top: rect.bottom + 8,
      left,
    })
  }

  return (
    <div className="surface-card ui-fade-in overflow-visible">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 border-b border-[var(--border-soft)] bg-[var(--bg-subtle)]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase"
              >
                Nombre
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase"
              >
                CUIT
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase"
              >
                Fecha de alta
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase"
              >
                Estado
              </th>
              {showOwner && (
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase"
                >
                  Propietario
                </th>
              )}
              <th
                scope="col"
                className="hidden px-4 py-3 text-right text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase md:table-cell"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-soft)]">
            {companies.map((company) => {
              const statusLabels = getCompanyStatusLabels(company)
              const canEditCompany = canViewerWriteCompany(company)

              return (
                <tr
                  key={company.id}
                  className="transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-[var(--bg-subtle)]"
                >
                  <td className="px-4 py-3 font-medium text-[var(--text-strong)]">
                    <div className="relative">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onView(company)}
                          className="min-w-0 text-left font-medium text-[var(--text-strong)] transition-colors hover:text-[var(--brand-700)]"
                        >
                          <span className="line-clamp-2">{company.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => openMobileActions(company, event.currentTarget)}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-muted)] transition-colors hover:border-[var(--brand-500)] hover:text-[var(--text-strong)] md:hidden"
                          aria-label={`Acciones para ${company.name}`}
                          aria-expanded={mobileActionsMenu?.company.id === company.id}
                        >
                          <svg
                            className="size-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M10 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                          </svg>
                        </button>
                      </div>
                      {company.is_demo && company.demo_slug && (
                        <p className="muted-text mt-1 text-xs">Slug de demo: {company.demo_slug}</p>
                      )}
                    </div>
                  </td>
                  <td className="muted-text px-4 py-3">{company.tax_id ?? '—'}</td>
                  <td className="muted-text px-4 py-3">
                    {new Date(company.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3">
                    {statusLabels.length === 0 ? (
                      <span className="muted-text text-xs">Operativa</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {statusLabels.map((label) => (
                          <span
                            key={label}
                            className={[
                              'rounded-full px-2 py-1 text-[11px] font-semibold',
                              label === 'Pendiente de apertura'
                                ? 'border border-amber-200 bg-amber-50 text-amber-700'
                                : 'border border-[var(--border-soft)] bg-[var(--bg-subtle)] text-[var(--text-muted)]',
                            ].join(' ')}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  {showOwner && <td className="muted-text px-4 py-3">{company.owner_username}</td>}
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex items-center justify-end gap-1">
                      {/* Ver */}
                      <button
                        type="button"
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
                        type="button"
                        onClick={() => onEdit(company)}
                        disabled={!canEditCompany}
                        className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Editar ${company.name}`}
                        title={canEditCompany ? 'Editar empresa' : 'Empresa en modo solo lectura'}
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
                        type="button"
                        onClick={() => onDelete(company)}
                        disabled={!canEditCompany}
                        className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Eliminar ${company.name}`}
                        title={canEditCompany ? 'Eliminar empresa' : 'Empresa en modo solo lectura'}
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
                      {canManageDemoPublication && company.is_demo && onToggleDemoPublication && (
                        <button
                          type="button"
                          onClick={() => onToggleDemoPublication(company)}
                          disabled={demoPublicationPendingId === company.id}
                          className="rounded-full border border-[var(--border-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--brand-500)] hover:bg-white hover:text-[var(--brand-700)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {demoPublicationPendingId === company.id
                            ? 'Actualizando…'
                            : company.is_published === true
                              ? 'Ocultar demo'
                              : 'Publicar demo'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {mobileActionsMenu &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Cerrar acciones"
              className="fixed inset-0 z-40 cursor-default bg-transparent md:hidden"
              onClick={() => setMobileActionsMenu(null)}
            />
            <div
              className="fixed z-50 w-44 rounded-2xl border border-[var(--border-soft)] bg-[linear-gradient(180deg,#f8fbff,#eef3f9)] py-1 text-[0.82rem] text-[var(--text-muted)] shadow-[0_18px_50px_-28px_rgba(10,29,64,0.75)] backdrop-blur-sm md:hidden"
              style={{ top: mobileActionsMenu.top, left: mobileActionsMenu.left }}
            >
              <button
                type="button"
                onClick={() => {
                  onView(mobileActionsMenu.company)
                  setMobileActionsMenu(null)
                }}
                className="menu-dropdown-item w-full text-left"
              >
                Ver empresa
              </button>
              <button
                type="button"
                onClick={() => {
                  onEdit(mobileActionsMenu.company)
                  setMobileActionsMenu(null)
                }}
                disabled={!canViewerWriteCompany(mobileActionsMenu.company)}
                className="menu-dropdown-item w-full text-left disabled:cursor-not-allowed disabled:opacity-40"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(mobileActionsMenu.company)
                  setMobileActionsMenu(null)
                }}
                disabled={!canViewerWriteCompany(mobileActionsMenu.company)}
                className="menu-dropdown-item w-full text-left disabled:cursor-not-allowed disabled:opacity-40"
              >
                Eliminar
              </button>
              {canManageDemoPublication &&
                mobileActionsMenu.company.is_demo &&
                onToggleDemoPublication && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleDemoPublication(mobileActionsMenu.company)
                      setMobileActionsMenu(null)
                    }}
                    disabled={demoPublicationPendingId === mobileActionsMenu.company.id}
                    className="menu-dropdown-item w-full text-left disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {demoPublicationPendingId === mobileActionsMenu.company.id
                      ? 'Actualizando…'
                      : mobileActionsMenu.company.is_published === true
                        ? 'Ocultar demo'
                        : 'Publicar demo'}
                  </button>
                )}
            </div>
          </>,
          document.body
        )}
    </div>
  )
}
