import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { GlossaryIcon } from '@/features/glossary/components/GlossaryIcon'
import type { GlossarySuggestion } from '@/features/glossary/types/glossary.types'

interface GlossarySearchBarProps {
  query: string
  onQueryChange: (value: string) => void
  suggestions: GlossarySuggestion[]
  onSelectSuggestion: (conceptId: string) => void
}

export function GlossarySearchBar({
  query,
  onQueryChange,
  suggestions,
  onSelectSuggestion,
}: GlossarySearchBarProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
      return
    }

    if (!suggestions.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => (current + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIsOpen(true)
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
      return
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      onSelectSuggestion(suggestions[activeIndex].id)
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  function handleClear() {
    onQueryChange('')
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const showSuggestions = isOpen && suggestions.length > 0

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="glossary-search" className="field-label">
        Buscar concepto o definición
      </label>
      <div className="relative mt-2">
        <div className="w-full rounded-xl border border-[var(--border-strong)] bg-white text-[var(--text-strong)] transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--brand-500)] focus-within:shadow-[0_0_0_2px_rgb(0_104_234_/_18%)]">
          <div className="flex items-center gap-3">
            <span className="pointer-events-none flex shrink-0 items-center pl-4 text-[var(--text-muted)]">
              <GlossaryIcon name="Search" className="size-4" />
            </span>
            <input
              id="glossary-search"
              ref={inputRef}
              type="text"
              value={query}
              placeholder="Ej. patrimonio, debe, libro diario..."
              className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-3 pl-0 text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:outline-none"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls={showSuggestions ? 'glossary-suggestions' : undefined}
              onChange={(event) => {
                onQueryChange(event.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="flex shrink-0 items-center pr-3 text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)]"
                aria-label="Limpiar búsqueda"
              >
                <GlossaryIcon name="X" className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showSuggestions && (
        <div
          id="glossary-suggestions"
          role="listbox"
          className="surface-card absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden py-1"
        >
          {suggestions.map((suggestion, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={suggestion.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={[
                  'flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--bg-subtle)] text-[var(--text-strong)]'
                    : 'text-[var(--text-muted)]',
                ].join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onSelectSuggestion(suggestion.id)
                  setIsOpen(false)
                  setActiveIndex(-1)
                }}
              >
                <span className="font-medium">{suggestion.suggestion}</span>
                <GlossaryIcon name="ChevronRight" className="size-3.5 text-[var(--brand-600)]" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
