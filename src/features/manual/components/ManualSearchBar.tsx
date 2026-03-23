import { Input } from '@/shared/ui/Input'
import { ManualIcon } from '@/features/manual/components/ManualIcon'

interface ManualSearchBarProps {
  query: string
  onQueryChange: (value: string) => void
}

export function ManualSearchBar({ query, onQueryChange }: ManualSearchBarProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="manual-search"
        className="text-sm font-semibold tracking-[0.01em] text-[var(--text-strong)]"
      >
        Buscar flujo o paso
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 inline-flex w-11 items-center justify-center text-[var(--text-muted)]">
          <ManualIcon name="Search" className="size-4.5" />
        </span>
        <Input
          id="manual-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Ej. apertura, libro diario, curso"
          className="pl-11"
        />
      </div>
    </div>
  )
}
