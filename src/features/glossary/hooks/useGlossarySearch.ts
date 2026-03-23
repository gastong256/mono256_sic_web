import { useMemo, useState } from 'react'
import MiniSearch from 'minisearch'
import glossaryData from '@/features/glossary/data/glossary-sic1.json'
import type {
  GlossaryConcept,
  GlossaryData,
  GlossaryDifficulty,
  GlossarySuggestion,
} from '@/features/glossary/types/glossary.types'

const data = glossaryData as GlossaryData

function normalizeGlossaryText(value: string): string {
  return value
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function compareGlossaryTerms(a: GlossaryConcept, b: GlossaryConcept): number {
  return a.term.localeCompare(b.term, 'es', { sensitivity: 'base' })
}

export function useGlossarySearch() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeDifficulty, setActiveDifficulty] = useState<GlossaryDifficulty | null>(null)
  const [activeLetter, setActiveLetter] = useState<string | null>(null)

  const conceptById = useMemo(
    () => new Map(data.concepts.map((concept) => [concept.id, concept])),
    []
  )

  const miniSearch = useMemo(() => {
    const engine = new MiniSearch<GlossaryConcept>({
      fields: ['term', 'definition', 'tags'],
      storeFields: ['id', 'term', 'category', 'difficulty'],
      searchOptions: {
        boost: { term: 3, tags: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    })

    engine.addAll(data.concepts)
    return engine
  }, [])

  const allConcepts = useMemo(() => [...data.concepts].sort(compareGlossaryTerms), [])

  const results = useMemo(() => {
    const searched = query.trim()
      ? miniSearch
          .search(query)
          .map((result) => conceptById.get(String(result.id)))
          .filter((concept): concept is GlossaryConcept => Boolean(concept))
      : allConcepts

    return searched.filter((concept) => {
      if (activeCategory && concept.category !== activeCategory) return false
      if (activeDifficulty && concept.difficulty !== activeDifficulty) return false
      if (activeLetter && normalizeGlossaryText(concept.term.charAt(0)) !== activeLetter)
        return false
      return true
    })
  }, [activeCategory, activeDifficulty, activeLetter, allConcepts, conceptById, miniSearch, query])

  const suggestions = useMemo<GlossarySuggestion[]>(() => {
    if (query.trim().length < 2) return []

    return miniSearch
      .autoSuggest(query)
      .slice(0, 6)
      .map((item) => {
        const matchingConcept = allConcepts.find(
          (concept) =>
            normalizeGlossaryText(concept.term) === normalizeGlossaryText(item.suggestion)
        )

        if (!matchingConcept) return null

        return {
          id: matchingConcept.id,
          suggestion: item.suggestion,
        }
      })
      .filter((item): item is GlossarySuggestion => Boolean(item))
  }, [allConcepts, miniSearch, query])

  const letters = useMemo(
    () =>
      Array.from(
        new Set(data.concepts.map((concept) => normalizeGlossaryText(concept.term.charAt(0))))
      ).sort((left, right) => left.localeCompare(right, 'es', { sensitivity: 'base' })),
    []
  )

  function clearFilters() {
    setQuery('')
    setActiveCategory(null)
    setActiveDifficulty(null)
    setActiveLetter(null)
  }

  return {
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
    categories: data.categories,
    meta: data.meta,
    totalCount: data.concepts.length,
    allConcepts,
    letters,
  }
}
