interface AlphabetNavProps {
  letters: string[]
  activeLetter: string | null
  onLetterChange: (value: string | null) => void
}

export function AlphabetNav({ letters, activeLetter, onLetterChange }: AlphabetNavProps) {
  return (
    <div className="space-y-2">
      <p className="field-label">Inicial</p>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {letters.map((letter) => {
          const isActive = letter === activeLetter
          return (
            <button
              key={letter}
              type="button"
              onClick={() => onLetterChange(isActive ? null : letter)}
              className={[
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all',
                isActive
                  ? 'border-[var(--brand-500)] bg-[var(--brand-500)] text-white shadow-[0_12px_20px_-16px_rgba(0,104,234,0.8)]'
                  : 'border-[var(--border-soft)] bg-white text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-strong)]',
              ].join(' ')}
              aria-pressed={isActive}
            >
              {letter}
            </button>
          )
        })}
      </div>
    </div>
  )
}
