import { useAdminUsers, useUpdateUserRole } from '@/features/admin/hooks/useAdminUsers'
import type { Role } from '@/shared/types'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/Alert'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useToast } from '@/shared/ui/ToastProvider'

export function AdminRolesPage() {
  const { pushToast } = useToast()
  const { data: users = [], isLoading, error } = useAdminUsers()
  const { mutate: updateRole, isPending } = useUpdateUserRole()

  return (
    <div className="space-y-6">
      <PageHeader
        icon="admin"
        title="Asignacion de roles"
        subtitle="Promove o revierte usuarios al rol docente."
      />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando usuarios..." />
        </div>
      )}

      {error && !isLoading && <Alert tone="error">Error al cargar usuarios.</Alert>}

      {!isLoading && !error && users.length === 0 && (
        <EmptyState
          icon="admin"
          title="No hay usuarios disponibles"
          description="No se encontraron registros para administrar roles."
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
                        value={user.role === 'admin' ? 'teacher' : user.role}
                        onChange={(e) =>
                          updateRole(
                            {
                              userId: user.id,
                              payload: { role: e.target.value as Exclude<Role, 'admin'> },
                            },
                            {
                              onSuccess: () => pushToast('Rol actualizado.', 'success'),
                              onError: () => pushToast('No se pudo actualizar el rol.', 'error'),
                            }
                          )
                        }
                        disabled={isPending || user.role === 'admin'}
                        className="rounded-md border border-[var(--border-strong)] px-2 py-1 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
                      >
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
