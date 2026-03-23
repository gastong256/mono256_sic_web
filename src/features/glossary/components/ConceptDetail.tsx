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

          {(concept.details || concept.example || concept.contraExample) && (
            <div className="grid gap-3 md:grid-cols-2">
              {concept.details && (
                <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-subtle)]/75 p-4 md:col-span-2">
                  <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
                    Detalle importante
                  </p>
                  <p className="mt-2 text-[0.94rem] leading-7 text-[var(--text-strong)]/90">
                    {concept.details}
                  </p>
                </div>
              )}

              {concept.example && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/85 p-4">
                  <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-emerald-700 uppercase">
                    Ejemplo
                  </p>
                  <p className="mt-2 text-[0.92rem] leading-7 text-emerald-950/85">
                    {concept.example}
                  </p>
                </div>
              )}

              {concept.contraExample && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4">
                  <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-amber-700 uppercase">
                    Contraejemplo
                  </p>
                  <p className="mt-2 text-[0.92rem] leading-7 text-amber-950/85">
                    {concept.contraExample}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            <span className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-white px-2.5 py-1 text-[0.73rem] font-medium text-[var(--text-muted)]">
              Categoria:{' '}
              <span className="ml-1 font-semibold text-[var(--text-strong)]">{category.label}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-white px-2.5 py-1 text-[0.73rem] font-medium text-[var(--text-muted)]">
              Unidad:{' '}
              <span className="ml-1 font-semibold text-[var(--text-strong)]">{category.unit}</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-white px-2.5 py-1 text-[0.73rem] font-medium text-[var(--text-muted)]">
              Pagina:{' '}
              <span className="ml-1 font-semibold text-[var(--text-strong)]">
                {concept.bookReference.page}
              </span>
            </span>
          </div>

          <div className="space-y-2.5">
            <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
              Palabras clave
            </p>
            <div className="flex flex-wrap gap-2">
              {concept.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-subtle)]/75 px-2.5 py-1 text-[0.73rem] font-medium text-[var(--text-muted)]"
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
        <div className="mt-5 space-y-2.5">
          <p className="text-[0.72rem] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">
            Conceptos relacionados
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedConcepts.map((relatedConcept) => (
              <button
                key={relatedConcept.id}
                type="button"
                onClick={() => onNavigate(relatedConcept.id)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-3 py-1.5 text-[0.82rem] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]"
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
