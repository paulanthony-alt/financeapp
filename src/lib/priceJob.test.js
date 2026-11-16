import { describe, it, expect } from 'vitest'
import { tickerUniverse, yahooSymbol, mergeWithPrevious } from './priceJob.js'

describe('price job', () => {
  it('covers reference funds and large companies, minus cash, plus extras', () => {
    const u = tickerUniverse('# my extras\nrklb\n\n  pltr  # comment\nnot a ticker!\nAMZN\n')
    for (const t of ['FXAIX', 'VOO', 'AMZN', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'META', 'RKLB', 'PLTR']) expect(u).toContain(t)
    expect(u).not.toContain('SPAXX')
    expect(u.filter((t) => t === 'AMZN')).toHaveLength(1)
    expect(u).toEqual([...u].sort())
  })
  it('maps share classes to Yahoo symbols', () => {
    expect(yahooSymbol('BRK.B')).toBe('BRK-B')
    expect(yahooSymbol('MSFT')).toBe('MSFT')
  })
  it('keeps old prices for tickers that failed tonight and merges new days', () => {
    const previous = { closes: { MSFT: [['2026-11-13', 1], ['2026-11-16', 2]], AMZN: [['2026-11-16', 9]] } }
    const merged = mergeWithPrevious({ MSFT: [['2026-11-16', 2.5], ['2026-11-17', 3]] }, previous)
    expect(merged.MSFT).toEqual([['2026-11-13', 1], ['2026-11-16', 2.5], ['2026-11-17', 3]])
    expect(merged.AMZN).toEqual([['2026-11-16', 9]])
    expect(mergeWithPrevious({ X: [['a', 1], ['b', 2], ['c', 3]] }, null, 2).X).toEqual([['b', 2], ['c', 3]])
  })
})
