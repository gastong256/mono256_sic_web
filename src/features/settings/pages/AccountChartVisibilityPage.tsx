import { useEffect, useMemo, useState } from 'react'
import {
  useAccountChartConfig,
  useUpdateAccountChartConfig,
} from '@/features/settings/hooks/useAccountChartConfig'
import { useAdminTeachers } from '@/features/admin/hooks/useAdminUsers'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { AccountLevelConfig } from '@/shared/types'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'
import { Alert } from '@/shared/ui/Alert'
import { useToast } from '@/shared/ui/ToastProvider'
import { getHttpErrorMessage } from '@/shared/lib/httpErrors'

type ChartTreeNode = AccountLevelConfig & { children: AccountLevelConfig[] }

function buildTree(items: AccountLevelConfig[]): ChartTreeNode[] {
  const level0 = items.filter((item) => item.level === 0)
  const level1 = items.filter((item) => item.level === 1)

  return level0.map((parent) => ({
    ...parent,
    children: level1.filter((child) => child.code.startsWith(`${parent.code}.`)),
  }))
}

export function AccountChartVisibilityPage() {
  const { pushToast } = useToast()
  const role = useAuthStore((state) => state.user?.role)
  const isRoleResolved = role === 'admin' || role === 'teacher'
  const isAdmin = role === 'admin'
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)

  const {
    data: teachers = [],
    isLoading: teachersLoading,
    error: teachersError,
  } = useAdminTeachers({ enabled: isAdmin })

  useEffect(() => {
    if (!isAdmin || teachers.length === 0) return
    const selectedStillExists = teachers.some((teacher) => teacher.id === selectedTeacherId)
    if (!selectedStillExists) {
      setSelectedTeacherId(teachers[0].id)
    }
  }, [isAdmin, teachers, selectedTeacherId])

  const teacherId = isAdmin ? (selectedTeacherId ?? undefined) : undefined
  const canLoadConfig =
    isRoleResolved && (!isAdmin || (typeof teacherId === 'number' && teacherId > 0))

  const {
    data = [],
    isLoading,
    error,
  } = useAccountChartConfig({
    teacherId,
    enabled: canLoadConfig,
  })
  const { mutate: saveConfig, isPending: saving } = useUpdateAccountChartConfig({
    teacherId,
  })

  const [draft, setDraft] = useState<AccountLevelConfig[]>([])
  const loadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(error, {
        defaultMessage: 'No se pudo cargar la configuración de visibilidad.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para configurar visibilidad del plan de cuentas.',
      }),
    [error]
  )
  const teachersErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(teachersError, {
        defaultMessage: 'No se pudieron cargar los docentes disponibles.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para consultar docentes.',
      }),
    [teachersError]
  )

  useEffect(() => {
    setDraft(data)
  }, [data])

  function toggle(accountId: number) {
    setDraft((current) =>
      current.map((item) =>
        item.account_id === accountId ? { ...item, visible: !item.visible } : item
      )
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon="settings"
        title="Visibilidad del plan de cuentas"
        subtitle={
          isAdmin
            ? 'Seleccioná un docente y configurá la visibilidad de cuentas globales nivel 0 y 1.'
            : 'Mostrá u ocultá cuentas globales nivel 0 y 1.'
        }
      />

      {isAdmin && (
        <section className="surface-card p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="text-sm font-semibold text-[var(--text-strong)]">
              Docente
              <select
                value={selectedTeacherId ?? ''}
                disabled={teachersLoading || teachers.length === 0}
                onChange={(event) => {
                  const nextId = Number(event.target.value)
                  setSelectedTeacherId(Number.isFinite(nextId) && nextId > 0 ? nextId : null)
                }}
                className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
              >
                <option value="" disabled>
                  Seleccioná un docente...
                </option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    @{teacher.username} · {`${teacher.first_name} ${teacher.last_name}`.trim()}
                  </option>
                ))}
              </select>
            </label>
            {teachersLoading && (
              <div className="pb-1">
                <Spinner className="size-5 text-[var(--brand-500)]" label="Cargando docentes..." />
              </div>
            )}
          </div>

          {teachersError && !teachersLoading && <Alert tone="error">{teachersErrorMessage}</Alert>}

          {!teachersLoading && !teachersError && teachers.length === 0 && (
            <Alert tone="warning">No hay docentes disponibles para configurar.</Alert>
          )}

          {!teachersLoading && !teachersError && teachers.length > 0 && !canLoadConfig && (
            <Alert tone="warning">Seleccioná un docente para cargar la configuración.</Alert>
          )}
        </section>
      )}

      {canLoadConfig && isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando configuracion..." />
        </div>
      )}

      {canLoadConfig && error && !isLoading && <Alert tone="error">{loadErrorMessage}</Alert>}

      {canLoadConfig && !isLoading && !error && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="divide-y divide-gray-100">
            {buildTree(draft).map((parent) => (
              <section key={parent.account_id} className="px-4 py-3">
                <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-xs text-gray-500">{parent.code}</p>
                    <p className="font-medium text-gray-900">{parent.name}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Visible
                    <input
                      type="checkbox"
                      checked={parent.visible}
                      onChange={() => toggle(parent.account_id)}
                      className="h-4 w-4"
                    />
                  </label>
                </div>

                {parent.children.length > 0 && (
                  <ul className="mt-2 space-y-2 pl-6">
                    {parent.children.map((child) => (
                      <li
                        key={child.account_id}
                        className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                      >
                        <div>
                          <p className="text-xs text-gray-500">{child.code}</p>
                          <p className="text-sm text-gray-900">{child.name}</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          Visible
                          <input
                            type="checkbox"
                            checked={child.visible}
                            onChange={() => toggle(child.account_id)}
                            className="h-4 w-4"
                          />
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="flex justify-end border-t border-gray-100 px-4 py-3">
            <Button
              onClick={() =>
                saveConfig(draft, {
                  onSuccess: () => pushToast('Visibilidad actualizada.', 'success'),
                  onError: (mutationError) =>
                    pushToast(
                      getHttpErrorMessage(mutationError, {
                        defaultMessage: 'No se pudo guardar la configuración.',
                        badRequestMessage:
                          'Hay valores inválidos en la configuración que intentaste guardar.',
                        forbiddenMessage:
                          'No tenés permisos para modificar visibilidad del plan de cuentas.',
                      }),
                      'error'
                    ),
                })
              }
              disabled={saving || !canLoadConfig}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
