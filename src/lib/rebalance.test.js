import { describe, it, expect } from 'vitest'
import { rebalanceWithContribution, lookThroughMixed, suggestedFunds } from './rebalance.js'

const T = { Stocks: 60, Bonds: 30, Cash: 10 }
const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)

describe('rebalanceWithContribution', () => {
  it('splits by target when already on target', () => {
    const r = rebalanceWithContribution({ Stocks: 600, Bonds: 300, Cash: 100 }, T, 100)
    expect(r.buys).toEqual({ Stocks: 60, Bonds: 30, Cash: 10 })
    expect(r.needed).toBeCloseTo(0)
  })
  it('sends a small contribution to the most underweight class only', () => {
    const r = rebalanceWithContribution({ Stocks: 80, Bonds: 10, Cash: 10 }, T, 10)
    expect(r.buys).toEqual({ Stocks: 0, Bonds: 10, Cash: 0 })
  })
  it('lands exactly on target when given the amount needed', () => {
    const cur = { Stocks: 80, Bonds: 10, Cash: 10 }
    const { needed } = rebalanceWithContribution(cur, T, 0)
    expect(needed).toBeCloseTo(100 / 0.75 - 100) // Stocks 80 is 60% of 133.33
    const r = rebalanceWithContribution(cur, T, needed)
    expect(r.afterPct.Stocks).toBeCloseTo(60, 1)
    expect(r.afterPct.Bonds).toBeCloseTo(30, 1)
    expect(r.afterPct.Cash).toBeCloseTo(10, 1)
  })
  it('fills the furthest-behind class first, then evens out', () => {
    // Bonds are 5% vs a 30% target; cash is 5% vs 10%. Bonds are further behind.
    const cur = { Stocks: 900, Bonds: 50, Cash: 50 }
    expect(rebalanceWithContribution(cur, T, 50).buys).toEqual({ Stocks: 0, Bonds: 50, Cash: 0 })
    // With more money both get some, ending at the same fraction of target.
    const r = rebalanceWithContribution(cur, T, 300)
    expect(r.buys).toEqual({ Stocks: 0, Bonds: 250, Cash: 50 })
    expect(r.after.Bonds / 0.3).toBeCloseTo(r.after.Cash / 0.1, 6)
  })
  it('never sells and always spends the full contribution, to the cent', () => {
    for (const c of [0.01, 1, 33.33, 1000, 123456.78]) {
      const r = rebalanceWithContribution({ Stocks: 1234.56, Bonds: 99.99, Cash: 7 }, T, c)
      expect(Object.values(r.buys).every((b) => b >= 0)).toBe(true)
      expect(Math.round(sum(r.buys) * 100)).toBe(Math.round(c * 100))
    }
  })
  it('handles an empty portfolio', () => {
    const r = rebalanceWithContribution({}, T, 1000)
    expect(r.buys).toEqual({ Stocks: 600, Bonds: 300, Cash: 100 })
  })
})

describe('lookThroughMixed', () => {
  it('splits multi-asset funds into stocks and bonds', () => {
    const r = lookThroughMixed({ Stocks: 100, Bonds: 0, Cash: 5, Mixed: 200 }, 90)
    expect(r.Stocks).toBeCloseTo(280)
    expect(r.Bonds).toBeCloseTo(20)
    expect(r.Cash).toBe(5)
  })
})

describe('suggestedFunds', () => {
  it('picks the largest holding per class, ignoring multi-asset funds', () => {
    const rows = [
      { symbol: 'FXAIX', cls: 'Stocks', value: 100 },
      { symbol: 'FTIHX', cls: 'Stocks', value: 300 },
      { symbol: 'FXNAX', cls: 'Bonds', value: 50 },
      { symbol: 'FFFHX', cls: 'Mixed', value: 999 },
    ]
    const s = suggestedFunds(rows)
    expect(s.Stocks.symbol).toBe('FTIHX')
    expect(s.Bonds.symbol).toBe('FXNAX')
    expect(s.Mixed).toBeUndefined()
  })
})
