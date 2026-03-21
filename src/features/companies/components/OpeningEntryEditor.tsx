import { useMemo } from 'react'
import type {
  OpeningEntryItemPayload,
  OpeningEntryPayload,
} from '@/features/companies/types/company.types'
import type { Account } from '@/features/accounts/types/account.types'
import {
  OPENING_INVENTORY_KIND_OPTIONS,
  getDefaultOpeningAssetParentCode,
  getDefaultOpeningLiabilityParentCode,
  getOpeningAssetParentOptions,
  getOpeningLiabilityParentOptions,
} from '@/features/companies/lib/companyAccounting'
import { useAccountsChart } from '@/features/accounts/hooks/useAccountsChart'
import { Button } from '@/shared/ui/Button'

interface OpeningEntryEditorProps {
  value: OpeningEntryPayload
  existingAccounts?: Account[]
  disabled?: boolean
  onChange: (value: OpeningEntryPayload) => void
}

function moneyToNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function collectMovementAccountNames(accounts: Account[] | undefined): Map<string, string[]> {
  const suggestions = new Map<string, string[]>()

  accounts?.forEach((root) => {
    root.children?.forEach((collective) => {
      if (collective.level !== 1) return
      const names = collective.children?.map((account) => account.name).filter(Boolean) ?? []
      if (names.length > 0) {
        suggestions.set(
          collective.code,
          Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
        )
      }
    })
  })

  return suggestions
}

function buildDefaultItem(parentCode: string): OpeningEntryItemPayload {
  return {
    parent_code: parentCode,
    name: '',
    amount: '0.00',
  }
}

function Section({
  title,
  hint,
  rows,
  disabled,
  datalistPrefix,
  suggestionsByParentCode,
  parentOptions,
  onChange,
  onAdd,
  onRemove,
}: {
  title: string
  hint: string
  rows: OpeningEntryItemPayload[]
  disabled: boolean
  datalistPrefix: string
  suggestionsByParentCode: Map<string, string[]>
  parentOptions: ReadonlyArray<{ code: string; label: string }>
  onChange: (index: number, patch: Partial<OpeningEntryItemPayload>) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border-soft)] p-4 xl:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-strong)]">{title}</h3>
          <p className="muted-text mt-1 text-xs">{hint}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={onAdd}
          aria-label={`Agregar concepto en ${title.toLowerCase()}`}
        >
          Agregar
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="muted-text text-sm">Todavía no agregaste conceptos.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((item, index) => {
            const datalistId = `${datalistPrefix}-${index}`
            const suggestions = suggestionsByParentCode.get(item.parent_code) ?? []

            return (
              <div
                key={`${item.parent_code}-${index}`}
                className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] p-3 xl:grid-cols-[8fr_8fr_8fr_1fr] xl:gap-4 xl:p-4"
              >
                <label className="min-w-0 text-sm font-semibold text-[var(--text-muted)]">
                  Colectiva padre
                  <select
                    value={item.parent_code}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(index, {
                        parent_code: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
                  >
                    {parentOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.code} · {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="min-w-0 text-sm font-semibold text-[var(--text-muted)]">
                  Cuenta movimiento
                  <input
                    type="text"
                    list={suggestions.length > 0 ? datalistId : undefined}
                    value={item.name}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(index, {
                        name: event.target.value,
                      })
                    }
                    placeholder="Ej: Caja Principal"
                    className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
                  />
                  {suggestions.length > 0 && (
                    <datalist id={datalistId}>
                      {suggestions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  )}
                </label>

                <label className="min-w-0 text-sm font-semibold text-[var(--text-muted)]">
                  Importe
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={item.amount}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(index, {
                        amount: event.target.value,
                      })
                    }
                    placeholder="0.00"
                    className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-right text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
                  />
                </label>

                <div className="flex items-end justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => onRemove(index)}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:border-red-300 hover:bg-red-100 hover:text-red-800 xl:h-10 xl:w-10 xl:px-0"
                    aria-label={`Quitar concepto ${index + 1}`}
                  >
                    <span className="xl:hidden">Eliminar</span>
                    <span className="hidden text-lg leading-none font-semibold xl:inline">×</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function OpeningEntryEditor({
  value,
  existingAccounts,
  disabled = false,
  onChange,
}: OpeningEntryEditorProps) {
  const { data: chart } = useAccountsChart()
  const suggestionsByParentCode = useMemo(
    () => collectMovementAccountNames(existingAccounts),
    [existingAccounts]
  )
  const assetParentOptions = useMemo(() => getOpeningAssetParentOptions(chart), [chart])
  const liabilityParentOptions = useMemo(() => getOpeningLiabilityParentOptions(chart), [chart])
  const totalAssets = useMemo(
    () => value.assets.reduce((sum, item) => sum + moneyToNumber(item.amount), 0),
    [value.assets]
  )
  const totalLiabilities = useMemo(
    () => value.liabilities.reduce((sum, item) => sum + moneyToNumber(item.amount), 0),
    [value.liabilities]
  )
  const capitalPreview = totalAssets - totalLiabilities

  function updateAsset(index: number, patch: Partial<OpeningEntryItemPayload>) {
    const nextAssets = value.assets.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    )
    onChange({ ...value, assets: nextAssets })
  }

  function updateLiability(index: number, patch: Partial<OpeningEntryItemPayload>) {
    const nextLiabilities = value.liabilities.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item
    )
    onChange({ ...value, liabilities: nextLiabilities })
  }

  return (
    <div className="space-y-5 rounded-2xl border border-[var(--border-soft)] bg-white p-4 xl:p-6">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[var(--text-strong)]">Apertura contable</h3>
        <p className="muted-text text-sm">
          Cargá activos y pasivos iniciales. El capital se calcula automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_2fr] xl:gap-5">
        <label className="min-w-0 text-sm font-semibold text-[var(--text-muted)]">
          Fecha
          <input
            type="date"
            value={value.date}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, date: event.target.value })}
            className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
          />
        </label>

        <label className="min-w-0 text-sm font-semibold text-[var(--text-muted)]">
          Tipo de inventario
          <select
            value={value.inventory_kind}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...value,
                inventory_kind: event.target.value as OpeningEntryPayload['inventory_kind'],
              })
            }
            className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
          >
            {OPENING_INVENTORY_KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0 text-sm font-semibold text-[var(--text-muted)]">
          Referencia
          <input
            type="text"
            value={value.source_ref ?? ''}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, source_ref: event.target.value })}
            placeholder="Opcional"
            className="mt-1 w-full rounded-xl border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text-strong)] focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)] focus:outline-none"
          />
        </label>
      </div>

      <Section
        title="Activos"
        hint="Seleccioná la colectiva padre y reutilizá o escribí el nombre de la cuenta movimiento."
        rows={value.assets}
        disabled={disabled}
        datalistPrefix="opening-assets"
        suggestionsByParentCode={suggestionsByParentCode}
        parentOptions={assetParentOptions}
        onChange={updateAsset}
        onAdd={() =>
          onChange({
            ...value,
            assets: [...value.assets, buildDefaultItem(getDefaultOpeningAssetParentCode(chart))],
          })
        }
        onRemove={(index) =>
          onChange({
            ...value,
            assets: value.assets.filter((_, itemIndex) => itemIndex !== index),
          })
        }
      />

      <Section
        title="Pasivos"
        hint="Podés reutilizar cuentas existentes o ingresar una nueva bajo la colectiva elegida."
        rows={value.liabilities}
        disabled={disabled}
        datalistPrefix="opening-liabilities"
        suggestionsByParentCode={suggestionsByParentCode}
        parentOptions={liabilityParentOptions}
        onChange={updateLiability}
        onAdd={() =>
          onChange({
            ...value,
            liabilities: [
              ...value.liabilities,
              buildDefaultItem(getDefaultOpeningLiabilityParentCode(chart)),
            ],
          })
        }
        onRemove={(index) =>
          onChange({
            ...value,
            liabilities: value.liabilities.filter((_, itemIndex) => itemIndex !== index),
          })
        }
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            Total activos
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-strong)]">
            {totalAssets.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            Total pasivos
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-strong)]">
            {totalLiabilities.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--bg-subtle)] px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            Capital calculado
          </p>
          <p
            className={[
              'mt-1 text-lg font-semibold',
              capitalPreview > 0 ? 'text-emerald-700' : 'text-[var(--danger-600)]',
            ].join(' ')}
          >
            {capitalPreview.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
