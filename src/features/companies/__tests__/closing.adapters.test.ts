import { describe, expect, it } from 'vitest'
import {
  normalizeClosingPreviewPayload,
  normalizeCurrentBookBalancesPayload,
} from '@/features/companies/adapters/closing.adapters'

describe('closing preview adapter', () => {
  it('normalizes grouped preview sections and preserves null adjustments', () => {
    const preview = normalizeClosingPreviewPayload({
      company_id: 4,
      company: 'Kiosco Estudiantil Demo',
      closing_date: '2026-03-21',
      reopening_date: '2026-03-22',
      books_closed_until: null,
      active_exercise: {
        exercise_id: 'opening:555',
        exercise_index: 1,
        opening_entry_id: 555,
        opening_source_type: 'OPENING',
        start_date: '2026-01-01',
        closing_entry_id: null,
        closing_date: null,
        snapshot_id: null,
        status: 'open',
      },
      previous_exercises: [],
      adjustments: {
        cash: {
          book_balance: null,
          actual_balance: null,
          difference: null,
          status: 'not_requested',
          entry: null,
        },
        inventory: {
          book_balance: null,
          actual_balance: null,
          difference: null,
          status: 'not_requested',
          entry: null,
        },
      },
      result_summary: {
        total_negative: '3000.00',
        total_positive: '8500.00',
        net_result: '5500.00',
        net_kind: 'gain',
      },
      balance_sheet: {
        date: '2026-03-21',
        assets: {
          groups: [
            {
              account_code: '1.01',
              account_name: 'Caja',
              subtotal: '85500.00',
              accounts: [
                {
                  account_id: 112,
                  account_code: '1.01.05',
                  account_name: 'Caja Mostrador',
                  account_type: 'AS',
                  amount: '85500.00',
                },
              ],
            },
          ],
          total: '137500.00',
        },
        liabilities: {
          groups: [],
          total: '27000.00',
        },
        equity: {
          groups: [
            {
              account_code: '3.01',
              account_name: 'Capital',
              subtotal: '105000.00',
              accounts: [
                {
                  account_id: 115,
                  account_code: '3.01.03',
                  account_name: 'Capital',
                  account_type: 'EQ',
                  amount: '105000.00',
                },
              ],
            },
          ],
          derived_result: {
            name: 'Resultado del Ejercicio',
            amount: '5500.00',
            kind: 'gain',
          },
          total: '110500.00',
        },
        equation: {
          total_assets: '137500.00',
          total_liabilities_plus_equity: '137500.00',
          is_balanced: true,
        },
      },
      income_statement: {
        date: '2026-03-21',
        positive_results: {
          accounts: [
            {
              account_code: '5.01',
              account_name: 'Ventas',
              subtotal: '8500.00',
              accounts: [
                {
                  account_id: 119,
                  account_code: '5.01.06',
                  account_name: 'Ventas Mostrador',
                  account_type: 'IN',
                  amount: '8500.00',
                },
              ],
            },
          ],
          total: '8500.00',
        },
        negative_results: {
          accounts: [
            {
              account_code: '4.02',
              account_name: 'Alquileres Perdidos',
              subtotal: '3000.00',
              accounts: [
                {
                  account_id: 118,
                  account_code: '4.02.02',
                  account_name: 'Luz y Agua',
                  account_type: 'EX',
                  amount: '3000.00',
                },
              ],
            },
          ],
          total: '3000.00',
        },
        net_result: {
          amount: '5500.00',
          kind: 'gain',
        },
      },
      entries: {
        adjustments: [],
        result_closing: [],
        patrimonial_closing: null,
        reopening: null,
      },
    })

    expect(preview.adjustments.cash.book_balance).toBeNull()
    expect(preview.result_summary.negative_total).toBe('3000.00')
    expect(preview.result_summary.positive_total).toBe('8500.00')
    expect(preview.result_summary.net_result_kind).toBe('gain')

    expect(preview.income_statement?.positive_results.accounts[0]).toEqual({
      account_code: '5.01',
      account_name: 'Ventas',
      subtotal: '8500.00',
      accounts: [
        {
          account_id: 119,
          account_code: '5.01.06',
          account_name: 'Ventas Mostrador',
          account_type: 'IN',
          amount: '8500.00',
        },
      ],
    })

    expect(preview.balance_sheet?.assets.groups[0]).toEqual({
      account_code: '1.01',
      account_name: 'Caja',
      subtotal: '85500.00',
      accounts: [
        {
          account_id: 112,
          account_code: '1.01.05',
          account_name: 'Caja Mostrador',
          account_type: 'AS',
          amount: '85500.00',
        },
      ],
    })

    expect(preview.balance_sheet?.equity.derived_result).toEqual({
      name: 'Resultado del Ejercicio',
      amount: '5500.00',
      kind: 'gain',
    })
  })

  it('normalizes current book balances for cash and inventory', () => {
    const balances = normalizeCurrentBookBalancesPayload({
      company_id: 2,
      company: 'El Tornillo Feliz SRL',
      as_of_date: '2026-03-16',
      books_closed_until: '2025-12-31',
      cash: {
        parent_code: '1.01',
        parent_name: 'Caja',
        total_debit: '7280350.00',
        total_credit: '1823500.00',
        book_balance: '5456850.00',
      },
      inventory: {
        parent_code: '1.09',
        parent_name: 'Mercaderías',
        total_debit: '13431710.00',
        total_credit: '10185470.00',
        book_balance: '3246240.00',
      },
    })

    expect(balances).toEqual({
      company_id: 2,
      company: 'El Tornillo Feliz SRL',
      as_of_date: '2026-03-16',
      books_closed_until: '2025-12-31',
      cash: {
        parent_code: '1.01',
        parent_name: 'Caja',
        total_debit: '7280350.00',
        total_credit: '1823500.00',
        book_balance: '5456850.00',
      },
      inventory: {
        parent_code: '1.09',
        parent_name: 'Mercaderías',
        total_debit: '13431710.00',
        total_credit: '10185470.00',
        book_balance: '3246240.00',
      },
    })
  })
})
