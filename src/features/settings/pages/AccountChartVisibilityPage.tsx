import { useEffect, useMemo, useState } from 'react'
import {
  useAccountChartBootstrap,
  useUpdateAccountChartConfig,
} from '@/features/settings/hooks/useAccountChartConfig'
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
    data: bootstrap,
    isLoading: bootstrapLoading,
    error: bootstrapError,
  } = useAccountChartBootstrap({
    teacherId: selectedTeacherId ?? undefined,
    enabled: isRoleResolved,
  })
  const teachers = bootstrap?.teachers ?? []

  useEffect(() => {
    if (!isAdmin) return
    const nextTeacherId = bootstrap?.selected_teacher_id ?? null
    if (nextTeacherId !== null && nextTeacherId !== selectedTeacherId) {
      setSelectedTeacherId(nextTeacherId)
    }
  }, [bootstrap?.selected_teacher_id, isAdmin, selectedTeacherId])

  const teacherId = isAdmin ? (selectedTeacherId ?? undefined) : undefined
  const canLoadConfig =
    isRoleResolved && (!isAdmin || (typeof teacherId === 'number' && teacherId > 0))

  const data = useMemo(() => bootstrap?.chart ?? [], [bootstrap?.chart])
  const { mutate: saveConfig, isPending: saving } = useUpdateAccountChartConfig({
    teacherId,
  })

  const [draft, setDraft] = useState<AccountLevelConfig[]>([])
  const loadErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(bootstrapError, {
        defaultMessage: 'No se pudo cargar la configuración de visibilidad.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para configurar visibilidad del plan de cuentas.',
      }),
    [bootstrapError]
  )
  const teachersErrorMessage = useMemo(
    () =>
      getHttpErrorMessage(bootstrapError, {
        defaultMessage: 'No se pudieron cargar los docentes disponibles.',
        unauthorizedMessage: 'Tu sesión expiró. Iniciá sesión nuevamente.',
        forbiddenMessage: 'No tenés permisos para consultar docentes.',
      }),
    [bootstrapError]
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
    <div className="page-shell">
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
        <section className="filter-panel p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="field-label text-[var(--text-strong)]">
              Docente
              <select
                value={selectedTeacherId ?? ''}
                disabled={bootstrapLoading || teachers.length === 0}
                onChange={(event) => {
                  const nextId = Number(event.target.value)
                  setSelectedTeacherId(Number.isFinite(nextId) && nextId > 0 ? nextId : null)
                }}
                className="field-control px-3 py-2 text-sm text-[var(--text-strong)]"
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
            {bootstrapLoading && (
              <div className="pb-1">
                <Spinner className="size-5 text-[var(--brand-500)]" label="Cargando docentes..." />
              </div>
            )}
          </div>

          {bootstrapError && !bootstrapLoading && (
            <Alert tone="error">{teachersErrorMessage}</Alert>
          )}

          {!bootstrapLoading && !bootstrapError && teachers.length === 0 && (
            <Alert tone="warning">No hay docentes disponibles para configurar.</Alert>
          )}

          {!bootstrapLoading && !bootstrapError && teachers.length > 0 && !canLoadConfig && (
            <Alert tone="warning">Seleccioná un docente para cargar la configuración.</Alert>
          )}
        </section>
      )}

      {!bootstrapLoading && !bootstrapError && data.length > 0 && (
        <Alert tone="info">
          {isAdmin
            ? `Configurá qué cuentas estarán disponibles para los alumnos del docente ${
                teachers.find((teacher) => teacher.id === selectedTeacherId)?.full_name ??
                'seleccionado'
              }.`
            : 'Configurá qué cuentas estarán disponibles para tus alumnos.'}
        </Alert>
      )}

      {canLoadConfig && bootstrapLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando configuracion..." />
        </div>
      )}

      {canLoadConfig && bootstrapError && !bootstrapLoading && (
        <Alert tone="error">{loadErrorMessage}</Alert>
      )}

      {canLoadConfig && !bootstrapLoading && !bootstrapError && (
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
