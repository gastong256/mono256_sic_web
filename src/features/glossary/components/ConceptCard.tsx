import type { GlossaryCategory, GlossaryConcept } from '@/features/glossary/types/glossary.types'
import {
  getGlossaryCategoryAccentClassName,
  getGlossaryCategoryToneClassName,
  getGlossaryDifficultyLabel,
  getGlossaryDifficultyToneClassName,
} from '@/features/glossary/components/glossaryVisuals'

interface ConceptCardProps {
  concept: GlossaryConcept
  category: GlossaryCategory
  isSelected: boolean
  onClick: () => void
}

export function ConceptCard({ concept, category, isSelected, onClick }: ConceptCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'surface-card group relative flex w-full flex-col overflow-hidden text-left transition-all duration-200',
        isSelected
          ? 'translate-y-[-1px] border-[var(--border-strong)] shadow-[0_20px_38px_-26px_rgba(10,29,64,0.45)]'
          : 'hover:translate-y-[-1px] hover:shadow-[0_20px_38px_-26px_rgba(10,29,64,0.38)]',
      ].join(' ')}
    >
      <span
        className={[
          'absolute inset-y-0 left-0 w-1.5',
          getGlossaryCategoryAccentClassName(category.id),
        ].join(' ')}
      />
      <div className="flex h-full flex-col gap-4 p-4 pl-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="pr-2 text-base font-semibold text-[var(--text-strong)]">
              {concept.term}
            </h3>
            <span
              className={[
                'inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-bold tracking-[0.08em] uppercase',
                getGlossaryDifficultyToneClassName(concept.difficulty),
              ].join(' ')}
            >
              {getGlossaryDifficultyLabel(concept.difficulty)}
            </span>
          </div>

          <p className="line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">
            {concept.definition}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span
            className={[
              'inline-flex items-center rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold',
              getGlossaryCategoryToneClassName(category.id),
            ].join(' ')}
          >
            {category.label}
          </span>
          <span className="text-[0.76rem] font-medium text-[var(--text-muted)]">
            Unidad {category.unit} · pag. {concept.bookReference.page}
          </span>
        </div>
      </div>
    </button>
  )
}
