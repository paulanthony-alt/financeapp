import { describe, it, expect } from 'vitest'
import { volatilityFor, monteCarlo, shareReaching, firstYearReaching, retirementTarget, toTodaysDollars, rng } from './simulate.js'
import { futureValue } from './finance.js'

describe('simulate', () => {
  it('maps returns to the documented volatility rule', () => {
    expect(volatilityFor(4.5)).toBe(7)
    expect(volatilityFor(6.5)).toBe(11)
    expect(volatilityFor(8.5)).toBe(15)
    expect(volatilityFor(0)).toBe(3)
    expect(volatilityFor(20)).toBe(18)
  })
  it('is deterministic for a seed', () => {
    const a = rng(42)
    const b = rng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('matches the straight-line projection when volatility is zero', () => {
    const sim = monteCarlo({ principal: 10000, monthly: 300, meanPct: 6.5, volPct: 0, years: 20, runs: 50 })
    const fv = futureValue(10000, 300, 6.5, 20)
    expect(sim.years[20].p10).toBe(Math.round(fv))
    expect(sim.years[20].p90).toBe(Math.round(fv))
  })
  it('spreads outcomes when there is volatility', () => {
    const sim = monteCarlo({ principal: 10000, monthly: 300, meanPct: 6.5, volPct: 11, years: 25, runs: 1000 })
    const end = sim.years[25]
    expect(end.p10).toBeLessThan(end.p50)
    expect(end.p50).toBeLessThan(end.p90)
    // volatility drag: the median sits below the straight-line average
    expect(end.p50).toBeLessThan(futureValue(10000, 300, 6.5, 25))
    expect(sim.years[0]).toEqual({ year: 0, p10: 10000, p50: 10000, p90: 10000 })
  })
  it('reports results in today’s dollars when given inflation', () => {
    const sim = monteCarlo({ principal: 1000, monthly: 0, meanPct: 5, volPct: 0, years: 10, runs: 10, inflationPct: 2 })
    expect(sim.years[10].p50).toBe(Math.round(futureValue(1000, 0, 5, 10) / Math.pow(1.02, 10)))
  })
  it('measures the share of paths reaching a target', () => {
    const sim = monteCarlo({ principal: 1000, monthly: 0, meanPct: 5, volPct: 0, years: 10, runs: 20 })
    const end = futureValue(1000, 0, 5, 10)
    expect(shareReaching(sim, end - 1, 10)).toBe(1)
    expect(shareReaching(sim, end + 1, 10)).toBe(0)
  })
  it('finds the first year a series reaches a target', () => {
    const series = [{ year: 0, p50: 1 }, { year: 1, p50: 5 }, { year: 2, p50: 9 }]
    expect(firstYearReaching(series, 'p50', 5)).toBe(1)
    expect(firstYearReaching(series, 'p50', 10)).toBeNull()
  })
  it('computes retirement targets and today’s dollars', () => {
    expect(retirementTarget(50000, 4)).toBe(1250000)
    expect(retirementTarget(50000, 0)).toBe(0)
    expect(toTodaysDollars(110, 10, 1)).toBeCloseTo(100)
  })
})
