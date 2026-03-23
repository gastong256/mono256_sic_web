import { Button } from '@/shared/ui/Button'
import { GlossaryIcon } from '@/features/glossary/components/GlossaryIcon'
import {
  getGlossaryCategoryToneClassName,
  getGlossaryDifficultyLabel,
  getGlossaryDifficultyToneClassName,
} from '@/features/glossary/components/glossaryVisuals'
import type { GlossaryCategory, GlossaryConcept } from '@/features/glossary/types/glossary.types'

interface ConceptDetailProps {
  concept: GlossaryConcept
  category: GlossaryCategory
  allConcepts: GlossaryConcept[]
  categories: GlossaryCategory[]
  onNavigate: (conceptId: string) => void
  onClose: () => void
}

export function ConceptDetail({
  concept,
  category,
  allConcepts,
  categories,
  onNavigate,
  onClose,
}: ConceptDetailProps) {
  const relatedConcepts = concept.relatedConcepts
    .map((relatedId) => allConcepts.find((candidate) => candidate.id === relatedId))
    .filter((candidate): candidate is GlossaryConcept => Boolean(candidate))

  const relatedLabelsById = new Map(
    categories.map((currentCategory) => [currentCategory.id, currentCategory.label])
  )

  return (
    <section className="surface-card border-[var(--border-strong)] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold',
                getGlossaryCategoryToneClassName(category.id),
              ].join(' ')}
            >
              <GlossaryIcon name={category.icon} className="size-4" />
              <span>{category.label}</span>
            </span>
            <span
              className={[
                'inline-flex items-center rounded-full border px-2.5 py-1 text-[0.72rem] font-bold tracking-[0.08em] uppercase',
                getGlossaryDifficultyToneClassName(concept.difficulty),
              ].join(' ')}
            >
              {getGlossaryDifficultyLabel(concept.difficulty)}
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="section-title text-[1.5rem] leading-tight sm:text-[1.65rem]">
              {concept.term}
            </h2>
            <p className="max-w-4xl text-[0.98rem] leading-8 text-[var(--text-strong)]/90">
              {concept.definition}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="metric-chip">
              Categoria: <span className="ml-1 font-semibold">{category.label}</span>
            </span>
            <span className="metric-chip">
              Unidad: <span className="ml-1 font-semibold">{category.unit}</span>
            </span>
            <span className="metric-chip">
              Pagina: <span className="ml-1 font-semibold">{concept.bookReference.page}</span>
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-[0.76rem] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
              Palabras clave
            </p>
            <div className="flex flex-wrap gap-2">
              {concept.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[0.76rem] font-medium text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Button type="button" variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      {relatedConcepts.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-[0.76rem] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
            Conceptos relacionados
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedConcepts.map((relatedConcept) => (
              <button
                key={relatedConcept.id}
                type="button"
                onClick={() => onNavigate(relatedConcept.id)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]"
              >
                <span>{relatedConcept.term}</span>
                <span className="text-[0.72rem] text-[var(--text-muted)]/90">
                  {relatedLabelsById.get(relatedConcept.category)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
