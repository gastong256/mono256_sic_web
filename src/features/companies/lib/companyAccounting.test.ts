import { describe, expect, it } from 'vitest'
import type { Account } from '@/features/accounts/types/account.types'
import {
  getOpeningAssetParentOptions,
  getOpeningLiabilityParentOptions,
} from '@/features/companies/lib/companyAccounting'

function makeAccount(
  id: number,
  code: string,
  name: string,
  level: number,
  children: Account[] = []
): Account {
  return {
    id,
    code,
    name,
    type: 'AS',
    level,
    is_leaf: children.length === 0,
    children,
  }
}

describe('companyAccounting', () => {
  it('filters asset parent options from the backend chart using the whitelist order', () => {
    const chart: Account[] = [
      makeAccount(1, '1', 'Activo', 0, [
        makeAccount(12, '1.02', 'Valores a Depositar', 1),
        makeAccount(11, '1.01', 'Caja', 1),
        makeAccount(14, '1.04', 'Bancos', 1),
        makeAccount(19, '1.99', 'No permitido', 1),
      ]),
    ]

    expect(getOpeningAssetParentOptions(chart)).toEqual([
      { code: '1.01', label: 'Caja' },
      { code: '1.02', label: 'Valores a Depositar' },
      { code: '1.04', label: 'Bancos' },
    ])
  })

  it('falls back to the built-in liability options when the chart is unavailable', () => {
    expect(getOpeningLiabilityParentOptions(undefined)).toEqual([
      { code: '2.01', label: 'Proveedores' },
      { code: '2.02', label: 'Acreedores Varios' },
      { code: '2.03', label: 'Documentos a Pagar' },
    ])
  })
})
