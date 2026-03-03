import { useEffect, useState } from 'react'
import {
  useAccountChartConfig,
  useUpdateAccountChartConfig,
} from '@/features/settings/hooks/useAccountChartConfig'
import type { AccountLevelConfig } from '@/shared/types'
import { Spinner } from '@/shared/ui/Spinner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/Button'

type ChartTreeNode = AccountLevelConfig & { children: AccountLevelConfig[] }

function buildTree(items: AccountLevelConfig[]): ChartTreeNode[] {
  const level1 = items.filter((item) => item.level === 1)
  const level2 = items.filter((item) => item.level === 2)

  return level1.map((parent) => ({
    ...parent,
    children: level2.filter((child) => child.code.startsWith(`${parent.code}.`)),
  }))
}

export function AccountChartVisibilityPage() {
  const { data = [], isLoading, error } = useAccountChartConfig()
  const { mutate: saveConfig, isPending: saving } = useUpdateAccountChartConfig()

  const [draft, setDraft] = useState<AccountLevelConfig[]>([])

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
        title="Visibilidad del plan de cuentas"
        subtitle="Mostra u oculta niveles 1 y 2 globalmente."
      />

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner className="size-8 text-[var(--brand-500)]" label="Cargando configuracion..." />
        </div>
      )}

      {error && !isLoading && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          Error al cargar configuración de visibilidad.
        </div>
      )}

      {!isLoading && !error && (
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
            <Button onClick={() => saveConfig(draft)} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
