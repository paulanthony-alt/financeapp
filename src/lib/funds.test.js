import { describe, it, expect } from 'vitest'
import { fundCosts, feeDrag, overlapWarnings, expenseRatio } from './funds.js'

describe('fund costs', () => {
  it('uses overrides before the table', () => {
    expect(expenseRatio('FXAIX')).toBe(0.015)
    expect(expenseRatio('FXAIX', { FXAIX: '0.02' })).toBe(0.02)
    expect(expenseRatio('ZZZZ')).toBeNull()
  })
  it('totals yearly cost and flags unknown funds', () => {
    const r = fundCosts([
      { symbol: 'FXAIX', value: 10000 },
      { symbol: 'FFFHX', value: 10000 },
      { symbol: 'MYSTERY', value: 5000 },
    ])
    expect(r.yearly).toBeCloseTo(1.5 + 75)
    expect(r.weightedEr).toBeCloseTo((76.5 / 20000) * 100)
    expect(r.coverage).toBeCloseTo(0.8)
    expect(r.unknown.map((u) => u.symbol)).toEqual(['MYSTERY'])
  })
  it('suggests a cheaper equivalent only when the saving is meaningful', () => {
    const r = fundCosts([{ symbol: 'FFFHX', value: 1 }, { symbol: 'FXAIX', value: 1 }, { symbol: 'QQQ', value: 1 }])
    expect(r.rows[0].cheaper.symbol).toBe('FIPFX')
    expect(r.rows[1].cheaper).toBeNull()
    expect(r.rows[2].cheaper).toBeNull() // 0.20 vs 0.15 is under the 0.10 point bar
  })
  it('measures growth lost to fees', () => {
    expect(feeDrag(100000, 6.5, 0, 25)).toBe(0)
    const drag = feeDrag(100000, 6.5, 0.75, 25)
    expect(drag).toBeGreaterThan(70000)
    expect(drag).toBeLessThan(100000)
  })
})

describe('overlap', () => {
  const w = (...symbols) => overlapWarnings(symbols.map((symbol) => ({ symbol })))
  it('has no warnings for a single broad fund', () => {
    expect(w('FXAIX', 'FXNAX', 'SPAXX')).toEqual([])
  })
  it('flags funds tracking the same index', () => {
    expect(w('FXAIX', 'VOO')[0]).toMatchObject({ kind: 'duplicate' })
  })
  it('flags S&P 500 inside a total-market fund', () => {
    expect(w('FXAIX', 'FSKAX').map((x) => x.kind)).toEqual(['overlap'])
  })
  it('flags Nasdaq-100 concentration', () => {
    expect(w('QQQ', 'FXAIX').map((x) => x.kind)).toEqual(['concentration'])
  })
  it('flags a target-date fund held with others', () => {
    expect(w('FFFHX', 'FXAIX').map((x) => x.kind)).toEqual(['target-date'])
    expect(w('FFFHX')).toEqual([])
  })
})
