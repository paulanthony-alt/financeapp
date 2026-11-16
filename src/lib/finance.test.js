import { describe, it, expect } from 'vitest'
import { futureValue, projectionSeries, requiredMonthly, monthsBetween } from './finance.js'

describe('finance', () => {
  it('future value with zero return is simple addition', () => {
    expect(futureValue(1000, 100, 0, 2)).toBe(1000 + 100 * 24)
  })
  it('matches a known compound-interest value', () => {
    // $0 start, $100/mo, 6% annual compounded monthly, 10 years = $16,387.93
    expect(futureValue(0, 100, 6, 10)).toBeCloseTo(16387.93, 1)
  })
  it('projection series starts at principal and ends at futureValue', () => {
    const s = projectionSeries(1000, 50, 5, 10)
    expect(s[0]).toMatchObject({ year: 0, balance: 1000, invested: 1000 })
    expect(s[10].balance).toBe(Math.round(futureValue(1000, 50, 5, 10)))
  })
  it('requires nothing when the goal is met', () => {
    expect(requiredMonthly(1000, 1000, '2027-01-01', new Date('2026-11-16'))).toBe(0)
  })
  it('divides what is left over the months remaining', () => {
    const now = new Date('2026-01-01T00:00:00')
    const months = monthsBetween(now, '2026-07-01')
    expect(months).toBeGreaterThanOrEqual(6)
    expect(requiredMonthly(6000, 0, '2026-07-01', now)).toBeCloseTo(6000 / months)
  })
  it('asks for the whole remainder when past due', () => {
    expect(requiredMonthly(1000, 400, '2020-01-01', new Date('2026-11-16'))).toBe(600)
  })
})
