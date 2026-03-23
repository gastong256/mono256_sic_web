import { useEffect, useMemo, useState } from 'react'
import { Alert } from '@/shared/ui/Alert'
import { Button } from '@/shared/ui/Button'
import { PageHeader } from '@/shared/ui/PageHeader'
import { AlphabetNav } from '@/features/glossary/components/AlphabetNav'
import { CategoryFilter } from '@/features/glossary/components/CategoryFilter'
import { ConceptDetail } from '@/features/glossary/components/ConceptDetail'
import { ConceptGrid } from '@/features/glossary/components/ConceptGrid'
import { DifficultyFilter } from '@/features/glossary/components/DifficultyFilter'
import { GlossarySearchBar } from '@/features/glossary/components/GlossarySearchBar'
import { getGlossaryCategoryById } from '@/features/glossary/components/glossaryVisuals'
import { useGlossarySearch } from '@/features/glossary/hooks/useGlossarySearch'

export function GlossaryPage() {
  const {
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    activeDifficulty,
    setActiveDifficulty,
    activeLetter,
    setActiveLetter,
    results,
    suggestions,
    clearFilters,
    categories,
    meta,
    totalCount,
    allConcepts,
    letters,
  } = useGlossarySearch()
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)

  const selectedConcept = useMemo(
    () => allConcepts.find((concept) => concept.id === selectedConceptId) ?? null,
    [allConcepts, selectedConceptId]
  )

  const selectedCategory = useMemo(
    () =>
      selectedConcept
        ? (getGlossaryCategoryById(categories, selectedConcept.category) ?? null)
        : null,
    [categories, selectedConcept]
  )

  useEffect(() => {
    if (!selectedConceptId) return
    if (!results.some((concept) => concept.id === selectedConceptId)) {
      setSelectedConceptId(null)
    }
  }, [results, selectedConceptId])

  function handleClearFilters() {
    clearFilters()
    setSelectedConceptId(null)
  }

  function handleSelectSuggestion(conceptId: string) {
    const concept = allConcepts.find((candidate) => candidate.id === conceptId)
    if (!concept) return

    setQuery(concept.term)
    setSelectedConceptId(concept.id)
  }

  function handleNavigateRelated(conceptId: string) {
    const related = allConcepts.find((candidate) => candidate.id === conceptId)
    if (!related) return

    clearFilters()
    setSelectedConceptId(related.id)
  }

  const hasActiveFilters = Boolean(query || activeCategory || activeDifficulty || activeLetter)

  return (
    <div className="page-shell">
      <PageHeader
        title="Glosario Contable"
        subtitle={`${meta.book} · ${meta.author} · ${totalCount} conceptos organizados por categoria, unidad y dificultad.`}
        icon="book"
      />

      <Alert tone="info">
        Material de apoyo teorico para repasar conceptos del SIC 1 y relacionarlos con la operatoria
        de la app.
      </Alert>

      <section className="filter-panel space-y-5 p-4 sm:p-5">
        <GlossarySearchBar
          query={query}
          onQueryChange={setQuery}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
        />

        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:items-start">
          <DifficultyFilter
            activeDifficulty={activeDifficulty}
            onDifficultyChange={setActiveDifficulty}
          />
          <AlphabetNav
            letters={letters}
            activeLetter={activeLetter}
            onLetterChange={setActiveLetter}
          />
        </div>
      </section>

      {hasActiveFilters && (
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--text-strong)]">
            {results.length} coincidencias
          </p>
          <Button type="button" variant="secondary" onClick={handleClearFilters}>
            Limpiar filtros
          </Button>
        </section>
      )}

      {selectedConcept && selectedCategory && (
        <ConceptDetail
          concept={selectedConcept}
          category={selectedCategory}
          allConcepts={allConcepts}
          categories={categories}
          onNavigate={handleNavigateRelated}
          onClose={() => setSelectedConceptId(null)}
        />
      )}

      <ConceptGrid
        concepts={results}
        categories={categories}
        selectedConceptId={selectedConceptId}
        onSelectConcept={setSelectedConceptId}
        onClearFilters={handleClearFilters}
      />

      <div className="pt-2 text-center text-[0.78rem] text-[var(--text-muted)]/80">
        <p>
          {totalCount} conceptos · Version {meta.version} · ultima actualizacion {meta.lastUpdated}
        </p>
      </div>
    </div>
  )
}
