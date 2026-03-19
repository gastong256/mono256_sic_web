import { useEffect, useMemo, useState } from 'react'
import { useAdminUsers, useUpdateUserRole } from '@/features/admin/hooks/useAdminUsers'
import type { Role } from '@/shared/types'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/ToastProvider'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'

export function AdminRolesPage() {
  const { pushToast } = useToast()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, roleFilter])

  const queryParams = useMemo(
    () => ({
      page,
      ...(search ? { search } : null),
      ...(roleFilter !== 'all' ? { role: roleFilter } : null),
    }),
    [page, roleFilter, search]
  )

  const { data: usersPage, isLoading, error } = useAdminUsers(queryParams)
  const users = usersPage?.results ?? []
  const { mutate: updateRole, isPending } = useUpdateUserRole()
  const canGoPrev = page > 1 && Boolean(usersPage?.previous ?? page > 1)
  const canGoNext = Boolean(usersPage?.next)
  const hasActiveFilters = roleFilter !== 'all' || search.length > 0
  const loadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudieron cargar los usuarios.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para administrar usuarios.',
      }),
    [error]
  )

  return (
    <div className="page-shell">
      <PageHeader
        icon="admin"
        title="Asignacion de roles"
        subtitle="Administrá cambios de rol con búsqueda, filtros y paginación sobre los usuarios del sistema."
      />

      <section className="filter-panel space-y-3 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            label="Buscar usuario"
            placeholder="username o texto"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <label className="text-sm font-semibold text-[var(--text-strong)]">
            Rol
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as 'all' | Role)}
              className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
            >
              <option value="all">Todos</option>
              <option value="admin">admin</option>
              <option value="teacher">teacher</option>
              <option value="student">student</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSearchInput('')
                setSearch('')
                setRoleFilter('all')
                setPage(1)
              }}
              disabled={!hasActiveFilters}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="muted-text text-xs">
            Página {page} · resultados mostrados: {users.length}
            {typeof usersPage?.count === 'number' ? ` de ${usersPage.count}` : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-1.5 text-xs"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!canGoPrev || isLoading}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="px-3 py-1.5 text-xs"
              onClick={() => setPage((current) => current + 1)}
              disabled={!canGoNext || isLoading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </section>

      {!isLoading && !error && users.length > 0 && (
        <section className="grid gap-3 md:grid-cols-3">
          <article className="summary-stat-card">
            <p className="summary-stat-label">Resultados en página</p>
            <p className="summary-stat-value">{users.length}</p>
          </article>
          <article className="summary-stat-card">
            <p className="summary-stat-label">Total consultado</p>
            <p className="summary-stat-value">{usersPage?.count ?? 0}</p>
          </article>
          <article className="summary-stat-card">
            <p className="summary-stat-label">Filtros activos</p>
            <p className="summary-stat-value">{hasActiveFilters ? 'Sí' : 'No'}</p>
          </article>
        </section>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando usuarios..." />
        </div>
      )}

      {error && !isLoading && <Alert tone="error">{loadErrorMessage}</Alert>}

      {!isLoading && !error && users.length === 0 && (
        <EmptyState
          icon="admin"
          title={
            hasActiveFilters
              ? 'Sin resultados para los filtros aplicados'
              : 'No hay usuarios disponibles'
          }
          description={
            hasActiveFilters
              ? 'Probá ajustar búsqueda, rol o página.'
              : 'No se encontraron registros para administrar roles.'
          }
        />
      )}

      {!isLoading && !error && users.length > 0 && (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-[var(--border-soft)] bg-[var(--bg-subtle)]">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase"
                  >
                    Usuario
                  </th>
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
                    Rol actual
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase"
                  >
                    Nuevo rol
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium text-[var(--text-strong)]">
                      @{user.username}
                    </td>
                    <td className="muted-text px-4 py-3">
                      {`${user.first_name} ${user.last_name}`.trim()}
                    </td>
                    <td className="muted-text px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateRole(
                            {
                              userId: user.id,
                              payload: { role: e.target.value as Role },
                            },
                            {
                              onSuccess: () => pushToast('Rol actualizado.', 'success'),
                              onError: () => pushToast('No se pudo actualizar el rol.', 'error'),
                            }
                          )
                        }
                        disabled={isPending}
                        className="rounded-md border border-[var(--border-strong)] px-2 py-1 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
                      >
                        <option value="admin">admin</option>
                        <option value="student">student</option>
                        <option value="teacher">teacher</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
