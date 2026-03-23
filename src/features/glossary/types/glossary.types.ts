export interface BookReference {
  chapter: number
  page: number
}

export type GlossaryDifficulty = 'basic' | 'intermediate' | 'advanced'

export interface GlossaryConcept {
  id: string
  term: string
  definition: string
  details?: string | null
  example?: string | null
  contraExample?: string | null
  category: string
  tags: string[]
  relatedConcepts: string[]
  bookReference: BookReference
  difficulty: GlossaryDifficulty
}

export interface GlossaryCategory {
  id: string
  label: string
  icon: string
  color: string
  unit: number
}

export interface GlossaryMeta {
  version: string
  author: string
  book: string
  edition: string
  isbn: string
  publisher: string
  lastUpdated: string
}

export interface GlossaryData {
  meta: GlossaryMeta
  categories: GlossaryCategory[]
  concepts: GlossaryConcept[]
}

export interface GlossarySuggestion {
  id: string
  suggestion: string
}
