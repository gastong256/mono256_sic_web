import { useMemo } from 'react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { ManualFlowSidebar } from '@/features/manual/components/ManualFlowSidebar'
import { ManualFlowView } from '@/features/manual/components/ManualFlowView'
import { ManualSearchBar } from '@/features/manual/components/ManualSearchBar'
import { useManualNavigation } from '@/features/manual/hooks/useManualNavigation'
import { getAllowedManualRoleIds } from '@/features/manual/lib/manualContent'

export function ManualPage() {
  const { user } = useAuthStore()
  const allowedRoleIds = useMemo(() => getAllowedManualRoleIds(user?.role), [user?.role])
  const {
    meta,
    roles,
    filteredFlows,
    activeFlowId,
    activeFlow,
    activeRoleFilter,
    searchQuery,
    setSearchQuery,
    setRoleFilter,
    selectFlow,
    resetNavigation,
  } = useManualNavigation(allowedRoleIds)

  const roleFilterOptions = [{ id: null, label: 'Todos' }, ...roles.map((role) => role)]

  const hasActiveFilters = Boolean(searchQuery || activeRoleFilter)

  return (
    <div className="page-shell">
      <PageHeader title={meta.title} subtitle={meta.description} icon="book" />

      <Alert tone="info">
        Esta guía resume los recorridos principales del simulador y está organizada por rol, pasos y
        capturas de referencia.
      </Alert>

      <section className="filter-panel space-y-5 p-4 sm:p-5">
        <ManualSearchBar query={searchQuery} onQueryChange={setSearchQuery} />

        {roles.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {roleFilterOptions.map((option) => {
              const isActive = activeRoleFilter === option.id
              const label = option.label

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setRoleFilter(option.id)}
                  aria-pressed={isActive}
                  className={[
                    'inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-700)] shadow-[0_12px_24px_-18px_rgba(0,104,234,0.35)]'
                      : 'border-[var(--border-soft)] bg-white/90 text-[var(--text-muted)] hover:text-[var(--text-strong)]',
                  ].join(' ')}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {hasActiveFilters && (
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--text-strong)]">
            {filteredFlows.length} flujos visibles
          </p>
          <Button type="button" variant="secondary" onClick={resetNavigation}>
            Limpiar filtros
          </Button>
        </section>
      )}

      {filteredFlows.length === 0 ? (
        <EmptyState
          icon="book"
          title="No encontramos flujos para ese criterio"
          description="Probá con otra búsqueda o quitá el filtro de rol para volver a ver todo el manual."
          action={
            <Button type="button" variant="secondary" onClick={resetNavigation}>
              Restablecer manual
            </Button>
          }
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <ManualFlowSidebar
            flows={filteredFlows}
            roles={roles}
            activeFlowId={activeFlowId}
            onSelectFlow={selectFlow}
          />

          <ManualFlowView flow={activeFlow} roles={roles} />
        </section>
      )}

      <div className="pt-2 text-center text-[0.78rem] text-[var(--text-muted)]/80">
        <p>
          Version {meta.version} · ultima actualizacion {meta.lastUpdated}
        </p>
      </div>
    </div>
  )
}
