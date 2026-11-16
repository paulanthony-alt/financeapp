import { describe, it, expect } from 'vitest'
import { newCompany, setStage, stageIndex, isClose, sortWatchlist, researchLinks, stageInfo, DEFAULT_WATCHLIST } from './ipo.js'

const c = (name, stage, expectedDate = '') => ({ ...newCompany({ name }, name, '2026-11-16'), stage, expectedDate })

describe('ipo watchlist', () => {
  it('creates a company at the start of the path', () => {
    const co = newCompany({ name: '  Stripe ', ticker: ' strp ' }, 'x', '2026-11-16')
    expect(co).toMatchObject({ name: 'Stripe', ticker: 'STRP', stage: 'watching', history: [{ stage: 'watching', date: '2026-11-16' }] })
  })
  it('records stage changes with dates, ignoring no-ops', () => {
    const co = newCompany({ name: 'A' }, 'a', '2026-11-01')
    const filed = setStage(co, 'filed', '2026-11-16')
    expect(filed.history.map((h) => h.stage)).toEqual(['watching', 'filed'])
    expect(filed.updatedAt).toBe('2026-11-16')
    expect(setStage(filed, 'filed', '2026-11-20')).toBe(filed)
  })
  it('knows the order of stages and what counts as close', () => {
    expect(stageIndex('watching')).toBe(0)
    expect(stageIndex('trading')).toBe(6)
    expect(stageIndex('withdrawn')).toBe(-1)
    expect(isClose(c('A', 'confidential'))).toBe(false)
    expect(isClose(c('A', 'filed'))).toBe(true)
    expect(isClose(c('A', 'priced'))).toBe(true)
    expect(isClose(c('A', 'trading'))).toBe(false)
    expect(stageInfo('nonsense').id).toBe('watching')
  })
  it('sorts closest-to-listing first, trading after, withdrawn last', () => {
    const sorted = sortWatchlist([
      c('Gone', 'withdrawn'),
      c('Live', 'trading'),
      c('Zeta', 'watching'),
      c('Alpha', 'watching'),
      c('Soon', 'roadshow'),
      c('Later', 'filed', '2027-03-01'),
      c('Earlier', 'filed', '2027-01-15'),
    ])
    expect(sorted.map((x) => x.name)).toEqual(['Soon', 'Earlier', 'Later', 'Alpha', 'Zeta', 'Live', 'Gone'])
  })
  it('builds safely encoded research links', () => {
    const [sec, news] = researchLinks({ name: 'AT&T Labs' })
    expect(sec.href).toContain(encodeURIComponent('"AT&T Labs"'))
    expect(sec.href).toContain('forms=S-1,F-1,424B4')
    expect(news.href).toBe('https://news.google.com/search?q=AT%26T%20Labs%20IPO')
  })
  it('starts with Anthropic on the list', () => {
    expect(DEFAULT_WATCHLIST('2026-11-16').map((x) => x.name)).toEqual(['Anthropic'])
  })
})
