import type {
  OpeningEntryPayload,
  OpeningInventoryKind,
} from '@/features/companies/types/company.types'
import type { Account } from '@/features/accounts/types/account.types'

type CompanyStateLike = {
  is_demo?: boolean
  is_read_only?: boolean
  viewer_can_write?: boolean
  is_published?: boolean
  demo_slug?: string | null
  has_opening_entry?: boolean
  accounting_ready?: boolean
  books_closed_until?: string | null
}

export interface OpeningParentOption {
  code: string
  label: string
}

const OPENING_ASSET_PARENT_OPTIONS_FALLBACK = [
  { code: '1.01', label: 'Caja' },
  { code: '1.02', label: 'Valores a Depositar' },
  { code: '1.04', label: 'Bancos' },
  { code: '1.06', label: 'Deudores por Ventas' },
  { code: '1.08', label: 'Documentos a Cobrar' },
  { code: '1.09', label: 'Mercaderias' },
  { code: '1.11', label: 'Inmuebles' },
  { code: '1.12', label: 'Rodados' },
  { code: '1.13', label: 'Muebles y Utiles' },
  { code: '1.14', label: 'Instalaciones' },
  { code: '1.15', label: 'Maquinarias' },
  { code: '1.16', label: 'Equipos de Computacion' },
] as const

const OPENING_LIABILITY_PARENT_OPTIONS_FALLBACK = [
  { code: '2.01', label: 'Proveedores' },
  { code: '2.02', label: 'Acreedores Varios' },
  { code: '2.03', label: 'Documentos a Pagar' },
] as const

const OPENING_ASSET_PARENT_CODES = OPENING_ASSET_PARENT_OPTIONS_FALLBACK.map(
  (option) => option.code
) as readonly string[]
const OPENING_LIABILITY_PARENT_CODES = OPENING_LIABILITY_PARENT_OPTIONS_FALLBACK.map(
  (option) => option.code
) as readonly string[]
const OPENING_PARENT_CODES = [
  ...OPENING_ASSET_PARENT_CODES,
  ...OPENING_LIABILITY_PARENT_CODES,
] as readonly string[]

export const OPENING_INVENTORY_KIND_OPTIONS: Array<{
  value: OpeningInventoryKind
  label: string
}> = [
  { value: 'INITIAL', label: 'Inventario inicial' },
  { value: 'GENERAL', label: 'Inventario general' },
]

function collectLevelOneAccounts(chart: Account[] | undefined): Account[] {
  if (!chart) return []

  return chart.flatMap((root) => root.children?.filter((account) => account.level === 1) ?? [])
}

function mapOptionsFromChart(
  chart: Account[] | undefined,
  allowedCodes: readonly string[],
  fallbackOptions: ReadonlyArray<OpeningParentOption>
): OpeningParentOption[] {
  const levelOneAccounts = collectLevelOneAccounts(chart)
  const chartOptions = allowedCodes.flatMap((code) => {
    const account = levelOneAccounts.find((item) => item.code === code)
    return account ? [{ code: account.code, label: account.name }] : []
  })

  return chartOptions.length > 0 ? chartOptions : [...fallbackOptions]
}

export function getOpeningAssetParentOptions(chart?: Account[]): OpeningParentOption[] {
  return mapOptionsFromChart(
    chart,
    OPENING_ASSET_PARENT_CODES,
    OPENING_ASSET_PARENT_OPTIONS_FALLBACK
  )
}

export function getOpeningLiabilityParentOptions(chart?: Account[]): OpeningParentOption[] {
  return mapOptionsFromChart(
    chart,
    OPENING_LIABILITY_PARENT_CODES,
    OPENING_LIABILITY_PARENT_OPTIONS_FALLBACK
  )
}

export function getDefaultOpeningAssetParentCode(chart?: Account[]): string {
  return (
    getOpeningAssetParentOptions(chart)[0]?.code ?? OPENING_ASSET_PARENT_OPTIONS_FALLBACK[0].code
  )
}

export function getDefaultOpeningLiabilityParentCode(chart?: Account[]): string {
  return (
    getOpeningLiabilityParentOptions(chart)[0]?.code ??
    OPENING_LIABILITY_PARENT_OPTIONS_FALLBACK[0].code
  )
}

export function filterAccountsForOpening(accounts: Account[]): Account[] {
  const filteredAccounts: Account[] = []

  for (const root of accounts) {
    const eligibleChildren =
      root.children?.filter((account) => OPENING_PARENT_CODES.includes(account.code)) ?? []

    if (eligibleChildren.length === 0) continue

    filteredAccounts.push({
      ...root,
      children: eligibleChildren,
    })
  }

  return filteredAccounts
}

export function getDefaultOpeningEntry(): OpeningEntryPayload {
  return {
    date: new Date().toISOString().slice(0, 10),
    inventory_kind: 'INITIAL',
    source_ref: '',
    assets: [
      {
        parent_code: getDefaultOpeningAssetParentCode(),
        name: '',
        amount: '0.00',
      },
    ],
    liabilities: [],
  }
}

export function validateOpeningEntry(value: OpeningEntryPayload): string | null {
  if (!value.date) return 'La fecha de apertura es obligatoria.'
  if (value.assets.length === 0) return 'Debes cargar al menos un activo.'

  const assetsTotal = value.assets.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const liabilitiesTotal = value.liabilities.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )

  const hasInvalidAsset = value.assets.some(
    (item) => item.name.trim().length === 0 || !(Number(item.amount) > 0)
  )
  if (hasInvalidAsset) {
    return 'Completá nombre e importe válido en todos los activos.'
  }

  const hasInvalidLiability = value.liabilities.some(
    (item) => item.name.trim().length === 0 || !(Number(item.amount) > 0)
  )
  if (hasInvalidLiability) {
    return 'Completá nombre e importe válido en todos los pasivos.'
  }

  if (!(assetsTotal - liabilitiesTotal > 0)) {
    return 'El capital resultante debe ser mayor a cero.'
  }

  return null
}

export function getCompanyAccountingBlockMessage(
  company: CompanyStateLike | null | undefined
): string {
  if (!company) {
    return 'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.'
  }

  if (company.viewer_can_write === false && company.is_read_only !== true) {
    return 'Esta empresa está compartida con tu curso en modo solo lectura. Podés consultarla, pero no registrar cambios contables.'
  }

  if (company.is_read_only) {
    return 'Esta empresa está en modo solo lectura y no permite registrar cambios contables.'
  }

  if (company.accounting_ready === false) {
    return 'La empresa necesita registrarse con inventario inicial o general antes de operar contablemente.'
  }

  return 'La operación no está disponible para esta empresa.'
}

export function getCompanyWriteBlockMessage(
  company: CompanyStateLike | null | undefined
): string | null {
  if (!company) return null
  if (company.viewer_can_write === false && company.is_read_only !== true) {
    return 'Esta empresa está compartida con tu curso en modo solo lectura.'
  }
  if (company.is_read_only) {
    return company.is_demo
      ? 'Empresa demo en modo solo lectura. Podés explorarla, pero no modificarla.'
      : 'La empresa está en modo solo lectura y no admite cambios.'
  }
  if (company.accounting_ready === false) {
    return 'Todavía no tiene apertura contable. Registrá el inventario inicial o general para empezar a operar.'
  }
  return null
}

export function getCompanyStatusLabels(company: CompanyStateLike | null | undefined): string[] {
  if (!company) return []

  const labels: string[] = []
  if (company.is_demo) labels.push('Demo')
  if (company.viewer_can_write === false && company.is_read_only !== true) labels.push('Compartida')
  if (company.is_demo && company.is_published === true) labels.push('Publicada')
  if (company.is_demo && company.is_published === false) labels.push('Oculta')
  if (company.is_read_only || company.viewer_can_write === false) labels.push('Solo lectura')
  if (company.accounting_ready === false) labels.push('Pendiente de apertura')
  if (company.books_closed_until) labels.push('Libros cerrados')

  return labels
}
