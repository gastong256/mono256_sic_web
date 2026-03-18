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
      requested_date_from: '2026-02-01',
      requested_date_to: '2026-03-31',
      requested_range: {
        date_from: '2026-02-01',
        date_to: '2026-03-31',
      },
      exercise_range: {
        date_from: '2026-03-01',
        date_to: null,
        status: 'open',
      },
      visible_range: {
        date_from: '2026-03-01',
        date_to: '2026-03-31',
      },
      active_exercise: {
        exercise_id: 'opening:10',
        exercise_index: 1,
        opening_entry_id: 10,
        opening_source_type: 'OPENING',
        start_date: '2026-03-01',
        closing_entry_id: null,
        closing_date: null,
        snapshot_id: null,
        status: 'open',
      },
      previous_exercises: [],
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
    expect(result.requested_date_from).toBe('2026-02-01')
    expect(result.requested_range).toEqual({
      date_from: '2026-02-01',
      date_to: '2026-03-31',
    })
    expect(result.exercise_range).toEqual({
      date_from: '2026-03-01',
      date_to: null,
      status: 'open',
    })
    expect(result.visible_range).toEqual({
      date_from: '2026-03-01',
      date_to: '2026-03-31',
    })
    expect(result.active_exercise?.exercise_id).toBe('opening:10')
    expect(result.entries).toHaveLength(1)
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
      requested_date_from: '2025-12-01',
      requested_date_to: '2026-01-31',
      requested_range: {
        date_from: '2025-12-01',
        date_to: '2026-01-31',
      },
      exercise_range: {
        date_from: '2026-01-01',
        date_to: null,
        status: 'open',
      },
      visible_range: {
        date_from: '2026-01-01',
        date_to: '2026-01-31',
      },
      active_exercise: {
        exercise_id: 'reopening:42',
        exercise_index: 2,
        opening_entry_id: 42,
        opening_source_type: 'REOPENING',
        start_date: '2026-01-01',
        closing_entry_id: null,
        closing_date: null,
        snapshot_id: null,
        status: 'open',
      },
      previous_exercises: [
        {
          exercise_id: 'opening:11',
          exercise_index: 1,
          opening_entry_id: 11,
          opening_source_type: 'OPENING',
          start_date: '2025-01-01',
          closing_entry_id: 41,
          closing_date: '2025-12-31',
          snapshot_id: 7,
          status: 'closed',
        },
      ],
      account_id: null,
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
      account_options: [
        {
          id: 42,
          code: '1.01.01',
          name: 'Caja Principal',
        },
      ],
    }

    const result = normalizeLedgerReportPayload(payload, 12, {})

    expect(result.company).toBe('Mi Empresa Demo')
    expect(result.active_exercise?.exercise_id).toBe('reopening:42')
    expect(result.previous_exercises).toHaveLength(1)
    expect(result.requested_range?.date_from).toBe('2025-12-01')
    expect(result.exercise_range?.date_from).toBe('2026-01-01')
    expect(result.visible_range?.date_to).toBe('2026-01-31')
    expect(result.accounts).toHaveLength(1)
    expect(result.accounts[0]).toMatchObject({
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
    expect(result.accounts[0].movements[0]).toEqual({
      entry_number: 1,
      date: '2026-01-05',
      description: 'Venta contado',
      source_ref: '',
      debit: 2500,
      credit: null,
      balance: 4000,
    })
    expect(result.account_options).toEqual([{ id: 42, code: '1.01.01', name: 'Caja Principal' }])
  })

  it('preserves valid empty-account responses for account filters', () => {
    const payload = {
      company_id: 12,
      company: 'Mi Empresa Demo',
      date_from: '2026-02-01',
      date_to: '2026-02-28',
      account_id: 42,
      accounts: [
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
    expect(result.accounts).toHaveLength(1)
    expect(result.accounts[0].movements).toEqual([])
    expect(result.accounts[0].opening_balance).toBe(0)
    expect(result.accounts[0].closing_balance).toBe(0)
    expect(result.accounts[0].period_totals).toEqual({
      total_debit: 0,
      total_credit: 0,
    })
  })
})

describe('normalizeTrialBalanceReportPayload', () => {
  it('normalizes the backend trial-balance payload using the canonical groups shape', () => {
    const payload = {
      company_id: 12,
      company: 'Mi Empresa Demo',
      date_from: '2026-03-01',
      date_to: '2026-03-31',
      requested_date_from: '2026-02-01',
      requested_date_to: '2026-03-31',
      requested_range: {
        date_from: '2026-02-01',
        date_to: '2026-03-31',
      },
      exercise_range: {
        date_from: '2026-03-01',
        date_to: null,
        status: 'open',
      },
      visible_range: {
        date_from: '2026-03-01',
        date_to: '2026-03-31',
      },
      active_exercise: {
        exercise_id: 'opening:10',
        exercise_index: 1,
        opening_entry_id: 10,
        opening_source_type: 'OPENING',
        start_date: '2026-03-01',
        closing_entry_id: null,
        closing_date: null,
        snapshot_id: null,
        status: 'open',
      },
      previous_exercises: [],
      groups: [
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
    expect(result.requested_date_to).toBe('2026-03-31')
    expect(result.active_exercise?.start_date).toBe('2026-03-01')
    expect(result.requested_range?.date_to).toBe('2026-03-31')
    expect(result.exercise_range?.status).toBe('open')
    expect(result.visible_range?.date_from).toBe('2026-03-01')
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0]).toMatchObject({
      account_code: '1.01',
      account_name: 'Caja',
      subtotal_debit: 2500,
      subtotal_credit: 800,
      subtotal_debit_balance: 1700,
      subtotal_credit_balance: null,
    })
    expect(result.groups[0].accounts[0]).toEqual({
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
