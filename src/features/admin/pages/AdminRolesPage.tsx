import { useAdminUsers, useUpdateUserRole } from '@/features/admin/hooks/useAdminUsers'
import type { Role } from '@/shared/types'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'

export function AdminRolesPage() {
  const { data: users = [], isLoading, error } = useAdminUsers()
  const { mutate: updateRole, isPending } = useUpdateUserRole()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asignacion de roles"
        subtitle="Promove o revierte usuarios al rol docente."
      />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando usuarios..." />
        </div>
      )}

      {error && !isLoading && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          Error al cargar usuarios.
        </div>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Usuario</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Rol actual</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Nuevo rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-gray-900">@{user.username}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {`${user.first_name} ${user.last_name}`.trim()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.role}</td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={user.role === 'admin' ? 'teacher' : user.role}
                      onChange={(e) =>
                        updateRole({
                          userId: user.id,
                          payload: { role: e.target.value as Exclude<Role, 'admin'> },
                        })
                      }
                      disabled={isPending || user.role === 'admin'}
                      className="rounded-md border border-gray-200 px-2 py-1 text-sm"
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
      )}
    </div>
  )
}
