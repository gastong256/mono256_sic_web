import { describe, expect, it } from 'vitest'
import {
  normalizeJournalBookReportPayload,
  normalizeLedgerReportPayload,
  normalizeTrialBalanceReportPayload,
} from '@/features/reports/adapters/reports.adapters'

describe('normalizeJournalBookReportPayload', () => {
  it('normalizes the backend journal-book payload without requiring journal detail fields', () => {
    const payload = {
      company_id: 12,
      company: 'Mi Empresa Demo',
      date_from: '2026-03-01',
      date_to: '2026-03-31',
      entries: [
        {
          entry_number: 4,
          date: '2026-03-10',
          description: 'Venta contado',
          source_type: 'MANUAL',
          source_ref: '',
          lines: [
            {
              account_code: '1.01.01',
              account_name: 'Caja Principal',
              debit: '2500.00',
              credit: null,
            },
          ],
          total_debit: '2500.00',
          total_credit: '2500.00',
        },
      ],
      totals: {
        total_debit: '2500.00',
        total_credit: '2500.00',
      },
    }

    const result = normalizeJournalBookReportPayload(payload, 12, {})

    expect(result.company).toBe('Mi Empresa Demo')
    expect(result.entries).toHaveLength(1)
    expect(result.results).toEqual(result.entries)
    expect(result.entries[0]).toMatchObject({
      entry_number: 4,
      source_type: 'MANUAL',
      total_debit: 2500,
      total_credit: 2500,
    })
    expect(result.entries[0].lines[0]).toEqual({
      account_code: '1.01.01',
      account_name: 'Caja Principal',
      debit: 2500,
      credit: null,
    })
  })
})

describe('normalizeLedgerReportPayload', () => {
  it('normalizes the backend ledger payload without requiring account ids per card', () => {
    const payload = {
      company_id: 12,
      company: 'Mi Empresa Demo',
      date_from: '2026-01-01',
      date_to: '2026-01-31',
      account_id: null,
      cards: [
        {
          account_code: '1.01.01',
          account_name: 'Caja Principal',
          account_type: 'AS',
          normal_balance: 'DEBIT',
          opening_balance: '1500.00',
          movements: [
            {
              date: '2026-01-05',
              entry_number: 1,
              description: 'Venta contado',
              source_ref: '',
              debit: '2500.00',
              credit: null,
              balance: '4000.00',
            },
          ],
          period_totals: {
            total_debit: '2500.00',
            total_credit: '0.00',
          },
          closing_balance: '4000.00',
        },
      ],
      accounts: [
        {
          account_code: '1.01.01',
          account_name: 'Caja Principal',
          account_type: 'AS',
          normal_balance: 'DEBIT',
          opening_balance: '1500.00',
          movements: [
            {
              date: '2026-01-05',
              entry_number: 1,
              description: 'Venta contado',
              source_ref: '',
              debit: '2500.00',
              credit: null,
              balance: '4000.00',
            },
          ],
          period_totals: {
            total_debit: '2500.00',
            total_credit: '0.00',
          },
          closing_balance: '4000.00',
        },
      ],
    }

    const result = normalizeLedgerReportPayload(payload, 12, {})

    expect(result.company).toBe('Mi Empresa Demo')
    expect(result.cards).toHaveLength(1)
    expect(result.cards[0]).toMatchObject({
      account_code: '1.01.01',
      account_name: 'Caja Principal',
      account_type: 'AS',
      normal_balance: 'DEBIT',
      opening_balance: 1500,
      period_totals: {
        total_debit: 2500,
        total_credit: 0,
      },
      closing_balance: 4000,
    })
    expect(result.cards[0].movements[0]).toEqual({
      entry_number: 1,
      date: '2026-01-05',
      description: 'Venta contado',
      source_ref: '',
      debit: 2500,
      credit: null,
      balance: 4000,
    })
    expect(result.accounts).toEqual(result.cards)
  })

  it('preserves valid empty-account responses for account filters', () => {
    const payload = {
      company_id: 12,
      company: 'Mi Empresa Demo',
      date_from: '2026-02-01',
      date_to: '2026-02-28',
      account_id: 42,
      cards: [
        {
          account_code: '1.04.03',
          account_name: 'Banco Galicia Cta Cte',
          account_type: 'AS',
          normal_balance: 'DEBIT',
          opening_balance: '0.00',
          movements: [],
          period_totals: {
            total_debit: '0.00',
            total_credit: '0.00',
          },
          closing_balance: '0.00',
        },
      ],
    }

    const result = normalizeLedgerReportPayload(payload, 12, { accountId: 42 })

    expect(result.account_id).toBe(42)
    expect(result.cards).toHaveLength(1)
    expect(result.cards[0].movements).toEqual([])
    expect(result.cards[0].opening_balance).toBe(0)
    expect(result.cards[0].closing_balance).toBe(0)
    expect(result.cards[0].period_totals).toEqual({
      total_debit: 0,
      total_credit: 0,
    })
  })
})

describe('normalizeTrialBalanceReportPayload', () => {
  it('normalizes the backend trial-balance payload with duplicated rows/groups shapes', () => {
    const payload = {
      company_id: 12,
      company: 'Mi Empresa Demo',
      date_from: '2026-03-01',
      date_to: '2026-03-31',
      rows: [
        {
          account_code: '1.01',
          account_name: 'Caja',
          account_type: 'AS',
          subtotal_debit: '2500.00',
          subtotal_credit: '800.00',
          subtotal_debit_balance: '1700.00',
          subtotal_credit_balance: null,
          accounts: [
            {
              account_code: '1.01.01',
              account_name: 'Caja Principal',
              account_type: 'AS',
              total_debit: '2500.00',
              total_credit: '800.00',
              debit_balance: '1700.00',
              credit_balance: null,
            },
          ],
        },
      ],
      totals: {
        total_debit: '2500.00',
        total_credit: '800.00',
        total_debit_balance: '1700.00',
        total_credit_balance: '0.00',
      },
    }

    const result = normalizeTrialBalanceReportPayload(payload, 12, {})

    expect(result.company).toBe('Mi Empresa Demo')
    expect(result.rows).toHaveLength(1)
    expect(result.groups).toEqual(result.rows)
    expect(result.rows[0]).toMatchObject({
      account_code: '1.01',
      account_name: 'Caja',
      subtotal_debit: 2500,
      subtotal_credit: 800,
      subtotal_debit_balance: 1700,
      subtotal_credit_balance: null,
    })
    expect(result.rows[0].accounts[0]).toEqual({
      account_code: '1.01.01',
      account_name: 'Caja Principal',
      account_type: 'AS',
      total_debit: 2500,
      total_credit: 800,
      debit_balance: 1700,
      credit_balance: null,
    })
    expect(result.totals).toEqual({
      total_debit: 2500,
      total_credit: 800,
      total_debit_balance: 1700,
      total_credit_balance: 0,
    })
  })
})
