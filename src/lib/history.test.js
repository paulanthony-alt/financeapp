import { describe, it, expect } from 'vitest'
import { upsertSnapshot, portfolioSnapshot, historyChange, computeNetWorth } from './history.js'

describe('history', () => {
  it('upserts by date and keeps order', () => {
    let h = upsertSnapshot([], { date: '2026-11-01', total: 100 })
    h = upsertSnapshot(h, { date: '2026-10-01', total: 90 })
    h = upsertSnapshot(h, { date: '2026-11-01', total: 120 })
    expect(h).toEqual([{ date: '2026-10-01', total: 90 }, { date: '2026-11-01', total: 120 }])
  })
  it('builds a portfolio snapshot', () => {
    const snap = portfolioSnapshot('2026-11-16', { total: 100.456, byClass: { Stocks: 60.123, Bonds: 40.333 }, rows: [1, 2] })
    expect(snap).toEqual({ date: '2026-11-16', total: 100.46, byClass: { Stocks: 60.12, Bonds: 40.33 }, holdings: 2 })
    const withBasis = portfolioSnapshot('2026-11-16', { total: 100, byClass: {}, rows: [], costBasis: 80.004 })
    expect(withBasis.costBasis).toBe(80)
  })
  it('computes change across history', () => {
    expect(historyChange([{ date: 'a', total: 100 }])).toBeNull()
    const c = historyChange([{ date: '2026-01-01', total: 100 }, { date: '2026-06-01', total: 125 }])
    expect(c.change).toBe(25)
    expect(c.pct).toBeCloseTo(0.25)
  })
  it('computes net worth with invested + debts', () => {
    const r = computeNetWorth([{ kind: 'asset', value: 1000 }, { kind: 'debt', value: 300 }, { kind: 'asset', value: '50' }], 500)
    expect(r).toEqual({ assets: 1550, debts: 300, net: 1250, invested: 500 })
  })
})
