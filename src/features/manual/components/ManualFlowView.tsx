import type { ManualFlow, ManualRole } from '@/features/manual/types/manual.types'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ManualIcon } from '@/features/manual/components/ManualIcon'
import { ManualStepCard } from '@/features/manual/components/ManualStepCard'
import { RoleBadge } from '@/features/manual/components/RoleBadge'

interface ManualFlowViewProps {
  flow: ManualFlow | null
  roles: ManualRole[]
}

export function ManualFlowView({ flow, roles }: ManualFlowViewProps) {
  if (!flow) {
    return (
      <EmptyState
        icon="book"
        title="Elegí un flujo del manual"
        description="Usá la búsqueda o el filtro por rol para encontrar el recorrido que querés estudiar."
        className="surface-card border-none py-16"
      />
    )
  }

  const flowRoles = flow.roles
    .map((roleId) => roles.find((role) => role.id === roleId))
    .filter((role): role is ManualRole => Boolean(role))

  return (
    <section className="space-y-5">
      <header className="surface-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-[linear-gradient(135deg,rgba(0,104,234,0.14),rgba(0,183,195,0.12))] text-[var(--brand-600)] shadow-[0_14px_30px_-24px_rgba(10,29,64,0.8)]">
                <ManualIcon name={flow.icon} className="size-6" />
              </span>
              <div className="min-w-0 space-y-2">
                <h2 className="section-title text-[1.45rem] leading-tight sm:text-[1.65rem]">
                  {flow.title}
                </h2>
                <p className="muted-text max-w-3xl text-sm leading-6">{flow.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {flowRoles.map((role) => (
                <RoleBadge key={`${flow.id}-${role.id}`} role={role} size="md" />
              ))}
              <span className="metric-chip">{flow.steps.length} pasos</span>
              <span className="metric-chip inline-flex items-center gap-1.5">
                <ManualIcon name="Clock" className="size-4" />
                {flow.estimatedTime}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {flow.steps.map((step, index) => (
          <ManualStepCard
            key={step.id}
            step={step}
            stepNumber={index + 1}
            totalSteps={flow.steps.length}
          />
        ))}
      </div>
    </section>
  )
}
