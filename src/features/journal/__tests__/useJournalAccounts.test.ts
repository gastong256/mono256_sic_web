import { describe, expect, it } from 'vitest'
import { collectMovementAccounts } from '@/features/journal/hooks/useJournalAccounts'

describe('collectMovementAccounts', () => {
  it('returns only movement accounts and excludes parent levels even when they have no visible children', () => {
    const accounts = [
      {
        id: 1,
        code: '1',
        name: 'Activo',
        type: 'asset',
        depth: 1,
        children: [
          {
            id: 11,
            code: '1.01',
            name: 'Caja y Bancos',
            type: 'asset',
            depth: 2,
            children: [
              {
                id: 301,
                code: '1.01.01',
                name: 'Caja en Pesos',
                type: 'asset',
                depth: 3,
                children: [],
              },
            ],
          },
          {
            id: 12,
            code: '1.02',
            name: 'Creditos',
            type: 'asset',
            depth: 2,
            children: [],
          },
        ],
      },
      {
        id: 2,
        code: '2',
        name: 'Pasivo',
        type: 'liability',
        depth: 1,
        children: [
          {
            id: 21,
            code: '2.01',
            name: 'Deudas Comerciales',
            type: 'liability',
            depth: 2,
            children: [],
          },
        ],
      },
    ]

    expect(collectMovementAccounts(accounts)).toEqual([
      {
        id: 301,
        code: '1.01.01',
        name: 'Caja en Pesos',
        type: 'asset',
        depth: 3,
        children: [],
      },
    ])
  })
})
