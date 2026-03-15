import { describe, expect, it } from 'vitest'
import { collectMovementAccounts } from '@/features/journal/hooks/useJournalAccounts'

describe('collectMovementAccounts', () => {
  it('returns only movement accounts and excludes parent levels even when they have no visible children', () => {
    const accounts = [
      {
        id: 1,
        code: '1',
        name: 'Activo',
        type: 'AS',
        level: 0,
        is_leaf: false,
        children: [
          {
            id: 11,
            code: '1.01',
            name: 'Caja y Bancos',
            type: 'AS',
            level: 1,
            is_leaf: false,
            children: [
              {
                id: 301,
                code: '1.01.01',
                name: 'Caja en Pesos',
                type: 'AS',
                level: 2,
                is_leaf: true,
                children: [],
              },
            ],
          },
          {
            id: 12,
            code: '1.02',
            name: 'Creditos',
            type: 'AS',
            level: 1,
            is_leaf: true,
            children: [],
          },
        ],
      },
      {
        id: 2,
        code: '2',
        name: 'Pasivo',
        type: 'LI',
        level: 0,
        is_leaf: false,
        children: [
          {
            id: 21,
            code: '2.01',
            name: 'Deudas Comerciales',
            type: 'LI',
            level: 1,
            is_leaf: true,
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
        type: 'AS',
        level: 2,
        is_leaf: true,
        children: [],
      },
    ])
  })
})
