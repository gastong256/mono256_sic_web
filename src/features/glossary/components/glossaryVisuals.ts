import type { GlossaryCategory, GlossaryDifficulty } from '@/features/glossary/types/glossary.types'

const categoryToneClassNames: Record<string, string> = {
  'info-systems':
    'border-blue-200 bg-blue-50/90 text-blue-700 shadow-[0_12px_24px_-18px_rgba(59,130,246,0.5)]',
  organizations:
    'border-violet-200 bg-violet-50/90 text-violet-700 shadow-[0_12px_24px_-18px_rgba(139,92,246,0.5)]',
  documents:
    'border-amber-200 bg-amber-50/90 text-amber-700 shadow-[0_12px_24px_-18px_rgba(245,158,11,0.45)]',
  payment:
    'border-emerald-200 bg-emerald-50/90 text-emerald-700 shadow-[0_12px_24px_-18px_rgba(16,185,129,0.45)]',
  patrimony:
    'border-rose-200 bg-rose-50/90 text-rose-700 shadow-[0_12px_24px_-18px_rgba(239,68,68,0.45)]',
  accounts:
    'border-pink-200 bg-pink-50/90 text-pink-700 shadow-[0_12px_24px_-18px_rgba(236,72,153,0.45)]',
  'double-entry':
    'border-indigo-200 bg-indigo-50/90 text-indigo-700 shadow-[0_12px_24px_-18px_rgba(99,102,241,0.45)]',
  books:
    'border-teal-200 bg-teal-50/90 text-teal-700 shadow-[0_12px_24px_-18px_rgba(20,184,166,0.45)]',
  tax: 'border-orange-200 bg-orange-50/90 text-orange-700 shadow-[0_12px_24px_-18px_rgba(249,115,22,0.45)]',
  companies:
    'border-cyan-200 bg-cyan-50/90 text-cyan-700 shadow-[0_12px_24px_-18px_rgba(6,182,212,0.45)]',
  'financial-statements':
    'border-lime-200 bg-lime-50/90 text-lime-700 shadow-[0_12px_24px_-18px_rgba(132,204,22,0.45)]',
}

const categoryAccentClassNames: Record<string, string> = {
  'info-systems': 'bg-blue-500',
  organizations: 'bg-violet-500',
  documents: 'bg-amber-500',
  payment: 'bg-emerald-500',
  patrimony: 'bg-rose-500',
  accounts: 'bg-pink-500',
  'double-entry': 'bg-indigo-500',
  books: 'bg-teal-500',
  tax: 'bg-orange-500',
  companies: 'bg-cyan-500',
  'financial-statements': 'bg-lime-500',
}

const difficultyToneClassNames: Record<GlossaryDifficulty, string> = {
  basic: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  intermediate: 'border-amber-200 bg-amber-50 text-amber-700',
  advanced: 'border-rose-200 bg-rose-50 text-rose-700',
}

export function getGlossaryCategoryToneClassName(categoryId: string): string {
  return (
    categoryToneClassNames[categoryId] ??
    'border-[var(--border-soft)] bg-[var(--bg-subtle)] text-[var(--text-strong)]'
  )
}

export function getGlossaryCategoryAccentClassName(categoryId: string): string {
  return categoryAccentClassNames[categoryId] ?? 'bg-[var(--brand-500)]'
}

export function getGlossaryDifficultyToneClassName(difficulty: GlossaryDifficulty): string {
  return difficultyToneClassNames[difficulty]
}

export function getGlossaryDifficultyLabel(difficulty: GlossaryDifficulty): string {
  switch (difficulty) {
    case 'basic':
      return 'Basico'
    case 'intermediate':
      return 'Intermedio'
    case 'advanced':
      return 'Avanzado'
  }
}

export function getGlossaryCategoryById(
  categories: GlossaryCategory[],
  categoryId: string
): GlossaryCategory | undefined {
  return categories.find((category) => category.id === categoryId)
}
