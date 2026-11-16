import { describe, it, expect } from 'vitest'
import { applyIpoStatus, mergeAlerts } from './ipoSync.js'
import { newCompany, setStage } from './ipo.js'

const anthropic = newCompany({ name: 'Anthropic' }, 'anthropic', '2026-11-16')
const status = (entry) => ({ updatedAt: '2026-11-21T01:30:00Z', companies: { anthropic: { name: 'Anthropic', checkedAt: '2026-11-21T01:30:00Z', ...entry } } })

describe('applyIpoStatus', () => {
  it('advances to trading with ticker, listing date, exchange, and an alert', () => {
    const r = applyIpoStatus([anthropic], status({ stage: 'trading', since: '2026-11-20', ticker: 'ANTH', exchange: 'NasdaqGS', form: '424B4', url: 'https://sec/x' }))
    const [c] = r.list
    expect(c).toMatchObject({ stage: 'trading', ticker: 'ANTH', expectedDate: '2026-11-20', notes: 'NasdaqGS' })
    expect(c.history.map((h) => [h.stage, h.date])).toEqual([['watching', '2026-11-16'], ['trading', '2026-11-20']])
    expect(c.auto).toEqual({ checkedAt: '2026-11-21T01:30:00Z', url: 'https://sec/x', form: '424B4' })
    expect(r.alerts).toEqual([{ id: 'anthropic:trading', name: 'Anthropic', stage: 'trading', text: 'Anthropic started trading on 2026-11-20 as ANTH (NasdaqGS).', url: 'https://sec/x', seen: false }])
    expect(r.tracked).toEqual(['Anthropic'])
    expect(r.changed).toBe(true)
  })
  it('never moves a company backward or overwrites a ticker you entered', () => {
    const ahead = { ...setStage(anthropic, 'priced', '2026-11-19'), ticker: 'MINE' }
    const r = applyIpoStatus([ahead], status({ stage: 'filed', since: '2026-11-01' }))
    expect(r.list[0].stage).toBe('priced')
    expect(r.alerts).toEqual([])
  })
  it('applies a withdrawal filed after the latest step', () => {
    const filed = setStage(anthropic, 'filed', '2026-11-01')
    expect(applyIpoStatus([filed], status({ stage: 'withdrawn', since: '2026-12-01' })).list[0].stage).toBe('withdrawn')
    expect(applyIpoStatus([filed], status({ stage: 'withdrawn', since: '2026-10-01' })).list[0].stage).toBe('filed')
  })
  it('matches names loosely and leaves untracked companies alone', () => {
    const stripe = newCompany({ name: 'Stripe' }, 's', '2026-11-16')
    const r = applyIpoStatus([{ ...anthropic, name: 'Anthropic, PBC' }, stripe], status({ stage: 'filed', since: '2026-11-18' }))
    expect(r.list[0].stage).toBe('filed')
    expect(r.list[1]).toBe(stripe)
  })
  it('records the check without alerting when nothing changed', () => {
    const r = applyIpoStatus([anthropic], status({ stage: null }))
    expect(r.list[0].stage).toBe('watching')
    expect(r.list[0].auto.checkedAt).toBe('2026-11-21T01:30:00Z')
    expect(r.alerts).toEqual([])
    expect(applyIpoStatus(r.list, status({ stage: null })).changed).toBe(false)
  })
})

describe('mergeAlerts', () => {
  it('never raises the same alert twice', () => {
    const a = [{ id: 'anthropic:filed', seen: true }]
    expect(mergeAlerts(a, [{ id: 'anthropic:filed', seen: false }, { id: 'anthropic:trading', seen: false }])).toEqual([
      { id: 'anthropic:filed', seen: true },
      { id: 'anthropic:trading', seen: false },
    ])
  })
})
