import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ConceptCard } from '@/features/glossary/components/ConceptCard'
import { getGlossaryCategoryById } from '@/features/glossary/components/glossaryVisuals'
import type { GlossaryCategory, GlossaryConcept } from '@/features/glossary/types/glossary.types'

interface ConceptGridProps {
  concepts: GlossaryConcept[]
  categories: GlossaryCategory[]
  selectedConceptId: string | null
  onSelectConcept: (conceptId: string) => void
  onClearFilters: () => void
}

export function ConceptGrid({
  concepts,
  categories,
  selectedConceptId,
  onSelectConcept,
  onClearFilters,
}: ConceptGridProps) {
  if (concepts.length === 0) {
    return (
      <EmptyState
        icon="book"
        title="No encontramos conceptos con esos filtros"
        description="Probá limpiar la búsqueda o ajustar categoría, dificultad o letra inicial."
        action={
          <Button type="button" variant="secondary" onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {concepts.map((concept) => {
        const category = getGlossaryCategoryById(categories, concept.category)
        if (!category) return null

        return (
          <ConceptCard
            key={concept.id}
            concept={concept}
            category={category}
            isSelected={concept.id === selectedConceptId}
            onClick={() => onSelectConcept(concept.id)}
          />
        )
      })}
    </div>
  )
}
