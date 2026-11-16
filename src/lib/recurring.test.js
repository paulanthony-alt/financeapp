import { describe, it, expect } from 'vitest'
import { dateForMonth, dueTransactions, skipMonth } from './recurring.js'

let n = 0
const makeId = () => `id${++n}`
const rule = { id: 'r1', description: 'Rent', amount: 1500, categoryId: 'rent', dayOfMonth: 1, startMonth: '2026-09' }

describe('recurring', () => {
  it('clamps the day to the month length', () => {
    expect(dateForMonth({ dayOfMonth: 31 }, '2026-02')).toBe('2026-02-28')
    expect(dateForMonth({ dayOfMonth: 31 }, '2028-02')).toBe('2028-02-29')
    expect(dateForMonth({ dayOfMonth: 5 }, '2026-11')).toBe('2026-11-05')
  })
  it('creates one transaction per month from the start month', () => {
    const due = dueTransactions([rule], [], '2026-11', '2026-11-16', makeId)
    expect(due.map((t) => t.date)).toEqual(['2026-09-01', '2026-10-01', '2026-11-01'])
    expect(due[0]).toMatchObject({ recurringId: 'r1', recurringMonth: '2026-09', amount: 1500 })
  })
  it('does not generate future dates', () => {
    const r = { ...rule, dayOfMonth: 28 }
    const due = dueTransactions([r], [], '2026-11', '2026-11-16', makeId)
    expect(due.map((t) => t.date)).toEqual(['2026-09-28', '2026-10-28'])
  })
  it('is idempotent', () => {
    const first = dueTransactions([rule], [], '2026-11', '2026-11-16', makeId)
    expect(dueTransactions([rule], first, '2026-11', '2026-11-16', makeId)).toEqual([])
  })
  it('respects skipped months and paused rules', () => {
    const skipped = skipMonth([rule], 'r1', '2026-10')
    const due = dueTransactions(skipped, [], '2026-11', '2026-11-16', makeId)
    expect(due.map((t) => t.recurringMonth)).toEqual(['2026-09', '2026-11'])
    expect(dueTransactions([{ ...rule, active: false }], [], '2026-11', '2026-11-16', makeId)).toEqual([])
  })
  it('skipMonth does not duplicate entries', () => {
    const once = skipMonth([rule], 'r1', '2026-10')
    expect(skipMonth(once, 'r1', '2026-10')[0].skipped).toEqual(['2026-10'])
  })
})
