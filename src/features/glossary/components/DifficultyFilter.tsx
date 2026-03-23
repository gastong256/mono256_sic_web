import type { GlossaryDifficulty } from '@/features/glossary/types/glossary.types'
import { getGlossaryDifficultyLabel } from '@/features/glossary/components/glossaryVisuals'

interface DifficultyFilterProps {
  activeDifficulty: GlossaryDifficulty | null
  onDifficultyChange: (value: GlossaryDifficulty | null) => void
}

const difficultyToneClassNames: Record<GlossaryDifficulty, string> = {
  basic: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  intermediate: 'border-amber-200 bg-amber-50 text-amber-700',
  advanced: 'border-rose-200 bg-rose-50 text-rose-700',
}

export function DifficultyFilter({ activeDifficulty, onDifficultyChange }: DifficultyFilterProps) {
  return (
    <div className="space-y-2">
      <p className="field-label">Dificultad</p>
      <div className="flex flex-wrap gap-2 lg:flex-nowrap">
        {(['basic', 'intermediate', 'advanced'] as const).map((difficulty) => {
          const isActive = difficulty === activeDifficulty
          return (
            <button
              key={difficulty}
              type="button"
              onClick={() => onDifficultyChange(isActive ? null : difficulty)}
              className={[
                'inline-flex min-h-9 items-center justify-center rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-all lg:flex-1',
                isActive
                  ? difficultyToneClassNames[difficulty]
                  : 'border-[var(--border-soft)] bg-white text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]',
              ].join(' ')}
              aria-pressed={isActive}
            >
              {getGlossaryDifficultyLabel(difficulty)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
