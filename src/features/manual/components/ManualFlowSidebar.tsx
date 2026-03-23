import { useEffect, useState } from 'react'
import type { ManualFlow, ManualRole } from '@/features/manual/types/manual.types'
import { ManualIcon } from '@/features/manual/components/ManualIcon'
import { RoleBadge } from '@/features/manual/components/RoleBadge'

interface ManualFlowSidebarProps {
  flows: ManualFlow[]
  roles: ManualRole[]
  activeFlowId: string | null
  onSelectFlow: (flowId: string) => void
}

export function ManualFlowSidebar({
  flows,
  roles,
  activeFlowId,
  onSelectFlow,
}: ManualFlowSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [activeFlowId])

  const activeFlow = flows.find((flow) => flow.id === activeFlowId) ?? flows[0] ?? null

  function getRoles(flow: ManualFlow) {
    return flow.roles
      .map((roleId) => roles.find((role) => role.id === roleId))
      .filter((role): role is ManualRole => Boolean(role))
  }

  return (
    <aside className="space-y-3">
      <div className="surface-card overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="manual-sidebar-items"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--text-muted)] uppercase">
              Flujos disponibles
            </p>
            <p className="truncate text-sm font-semibold text-[var(--text-strong)]">
              {activeFlow?.title ?? 'Seleccioná un flujo'}
            </p>
          </div>
          <ManualIcon
            name="ChevronDown"
            className={['size-4 transition-transform', mobileOpen ? 'rotate-180' : ''].join(' ')}
          />
        </button>

        <div
          id="manual-sidebar-items"
          className={[
            'grid gap-2 p-3 md:grid md:p-3',
            mobileOpen || flows.length <= 1 ? 'grid' : 'hidden md:grid',
          ].join(' ')}
        >
          {flows.map((flow) => {
            const isActive = flow.id === activeFlowId
            const flowRoles = getRoles(flow)

            return (
              <button
                key={flow.id}
                type="button"
                onClick={() => onSelectFlow(flow.id)}
                className={[
                  'rounded-2xl border px-3.5 py-3 text-left transition-all duration-200',
                  isActive
                    ? 'border-[var(--brand-200)] bg-[linear-gradient(135deg,rgba(0,104,234,0.1),rgba(0,183,195,0.08))] shadow-[0_16px_34px_-28px_rgba(0,104,234,0.55)]'
                    : 'border-transparent bg-white/30 hover:border-[var(--border-soft)] hover:bg-white/75',
                ].join(' ')}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={[
                      'inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border',
                      isActive
                        ? 'border-[var(--brand-200)] bg-white text-[var(--brand-700)]'
                        : 'border-[var(--border-soft)] bg-white text-[var(--text-muted)]',
                    ].join(' ')}
                  >
                    <ManualIcon name={flow.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="space-y-1">
                      <p className="text-sm leading-5 font-semibold text-[var(--text-strong)]">
                        {flow.title}
                      </p>
                      <p className="text-xs leading-5 text-[var(--text-muted)]">
                        {flow.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {flowRoles.map((role) => (
                        <RoleBadge key={`${flow.id}-${role.id}`} role={role} size="sm" />
                      ))}
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-soft)] bg-white/70 px-2 py-0.5 text-[0.72rem] font-semibold text-[var(--text-muted)]">
                        <ManualIcon name="Clock" className="size-3.5" />
                        {flow.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
