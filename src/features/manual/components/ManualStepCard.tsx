import type { FlowStep } from '@/features/manual/types/manual.types'
import { ManualIcon } from '@/features/manual/components/ManualIcon'
import { ManualImage } from '@/features/manual/components/ManualImage'
import { renderInlineEmphasis } from '@/features/manual/lib/manualContent'

interface ManualStepCardProps {
  step: FlowStep
  stepNumber: number
  totalSteps: number
}

export function ManualStepCard({ step, stepNumber, totalSteps }: ManualStepCardProps) {
  return (
    <article className="surface-card overflow-hidden border border-transparent p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-soft)] bg-white text-sm font-bold text-[var(--text-strong)]">
            {stepNumber}
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold tracking-[0.14em] text-[var(--text-muted)] uppercase">
              Paso {stepNumber} de {totalSteps}
            </p>
            <h3 className="text-lg leading-tight font-semibold text-[var(--text-strong)]">
              {step.title}
            </h3>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-3 text-sm leading-7 text-[var(--text-muted)]">
          {renderInlineEmphasis(step.description).map((fragment) => (
            <span
              key={fragment.key}
              className={fragment.strong ? 'font-semibold text-[var(--text-strong)]' : ''}
            >
              {fragment.text}
            </span>
          ))}
        </div>

        <ManualImage screenshot={step.screenshot} alt={`${step.title} - captura del manual`} />

        {step.tip && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/85 px-4 py-3 text-sm text-amber-800">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-amber-700">
                <ManualIcon name="Lightbulb" className="size-3.5" />
              </span>
              <div className="space-y-1">
                <p className="text-xs font-semibold tracking-[0.12em] text-amber-700 uppercase">
                  Tip
                </p>
                <p className="leading-6">{step.tip}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
