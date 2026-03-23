import { GlossaryIcon } from '@/features/glossary/components/GlossaryIcon'
import { getGlossaryCategoryToneClassName } from '@/features/glossary/components/glossaryVisuals'
import type { GlossaryCategory } from '@/features/glossary/types/glossary.types'

interface CategoryFilterProps {
  categories: GlossaryCategory[]
  activeCategory: string | null
  onCategoryChange: (value: string | null) => void
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="space-y-2">
      <p className="field-label">Categorias</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((category) => {
          const isActive = category.id === activeCategory
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(isActive ? null : category.id)}
              className={[
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-all',
                isActive
                  ? getGlossaryCategoryToneClassName(category.id)
                  : 'border-[var(--border-soft)] bg-white text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]',
              ].join(' ')}
              aria-pressed={isActive}
            >
              <GlossaryIcon name={category.icon} className="size-4" />
              <span>{category.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
