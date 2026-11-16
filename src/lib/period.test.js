import { describe, it, expect } from 'vitest'
import { monthKey, shiftMonth, monthLabel, inMonth, sumByCategory, monthlyTotals } from './period.js'

describe('period', () => {
  it('derives month keys', () => {
    expect(monthKey('2026-11-16')).toBe('2026-11')
    expect(monthKey(new Date(2026, 0, 5))).toBe('2026-01')
  })
  it('shifts across year boundaries', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01')
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2026-03', -14)).toBe('2025-01')
  })
  it('labels months', () => {
    expect(monthLabel('2026-11')).toBe('November 2026')
  })
  it('filters and sums by month', () => {
    const txs = [
      { date: '2026-10-31', amount: 10, categoryId: 'a' },
      { date: '2026-11-01', amount: 20, categoryId: 'a' },
      { date: '2026-11-30', amount: 5, categoryId: 'b' },
    ]
    const nov = inMonth(txs, '2026-11')
    expect(nov).toHaveLength(2)
    expect(sumByCategory([{ id: 'a' }, { id: 'b' }, { id: 'c' }], nov)).toEqual({ a: 20, b: 5, c: 0 })
  })
  it('builds trailing monthly totals including empty months', () => {
    const txs = [{ date: '2026-11-02', amount: 50, categoryId: 'a' }]
    const rows = monthlyTotals(txs, '2026-11', 3)
    expect(rows.map((r) => r.key)).toEqual(['2026-09', '2026-10', '2026-11'])
    expect(rows.map((r) => r.spent)).toEqual([0, 0, 50])
  })
})
