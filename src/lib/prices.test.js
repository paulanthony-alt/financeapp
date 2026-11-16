import { describe, it, expect } from 'vitest'
import { parseYahooChart, closeOn, revaluePortfolio, dailySnapshots, mergeDailyHistory, dayChange } from './prices.js'

// Shape of Yahoo's /v8/finance/chart response (US exchange, gmtoffset = -5h).
const yahoo = (symbol, rows) => ({
  chart: {
    result: [{
      meta: { symbol, gmtoffset: -18000 },
      timestamp: rows.map(([d]) => Date.parse(`${d}T14:30:00Z`) / 1000),
      indicators: { quote: [{ close: rows.map(([, c]) => c) }] },
    }],
    error: null,
  },
})

const portfolio = {
  importedAt: '2026-11-16T05:00:00.000Z',
  fileName: 'p.csv',
  accountCount: 1,
  holdings: [
    { symbol: 'CORE', value: 3.18, quantity: 0, coreCash: true },
    { symbol: 'MSFT', value: 273.98, quantity: 0.523, costBasis: 199.94 },
    { symbol: 'FXAIX', value: 583.02, quantity: 2.217, costBasis: 543.11 },
    { symbol: 'ZZZZ', value: 50, quantity: 1 },
  ],
}
const prices = {
  updatedAt: '2026-11-18T01:30:00Z',
  closes: {
    MSFT: [['2026-11-13', 523.88], ['2026-11-16', 530], ['2026-11-17', 540]],
    FXAIX: [['2026-11-13', 262.98], ['2026-11-16', 264], ['2026-11-17', 265]],
  },
}

describe('parseYahooChart', () => {
  it('reads closes by trading date and skips empty bars', () => {
    const r = parseYahooChart(yahoo('AMZN', [['2026-11-13', 266.66], ['2026-11-14', null], ['2026-11-17', 270.123456]]), Date.parse('2026-11-18T12:00:00Z'))
    expect(r).toEqual({ symbol: 'AMZN', series: [['2026-11-13', 266.66], ['2026-11-17', 270.1235]] })
  })
  it('skips today’s bar until the market has closed', () => {
    const json = yahoo('AMZN', [['2026-11-13', 266.66], ['2026-11-16', 261.75]])
    // 11:30 am ET on Nov 16 (16:30 UTC): still trading, so no Nov 16 close yet.
    expect(parseYahooChart(json, Date.parse('2026-11-16T16:30:00Z')).series).toEqual([['2026-11-13', 266.66]])
    // 8:30 pm ET: the close is final.
    expect(parseYahooChart(json, Date.parse('2026-11-17T01:30:00Z')).series.pop()).toEqual(['2026-11-16', 261.75])
    // Earlier days are never dropped.
    expect(parseYahooChart(json, Date.parse('2026-11-14T15:00:00Z')).series).toHaveLength(2)
  })
  it('throws a readable error when Yahoo reports one', () => {
    expect(() => parseYahooChart({ chart: { result: null, error: { description: 'No data found' } } })).toThrow('No data found')
  })
})

describe('closeOn', () => {
  it('finds the close on or before a date', () => {
    const s = prices.closes.MSFT
    expect(closeOn(s, '2026-11-16')).toEqual(['2026-11-16', 530])
    expect(closeOn(s, '2026-11-15')).toEqual(['2026-11-13', 523.88])
    expect(closeOn(s, '2026-11-01')).toBeNull()
  })
})

describe('revaluePortfolio', () => {
  it('values priced holdings at the latest close and leaves the rest', () => {
    const r = revaluePortfolio(portfolio, prices)
    const by = Object.fromEntries(r.portfolio.holdings.map((h) => [h.symbol, h]))
    expect(by.MSFT).toMatchObject({ value: 282.42, price: 540, priceDate: '2026-11-17', prevClose: 530 })
    expect(by.FXAIX.value).toBe(587.51) // 2.217 * 265
    expect(by.CORE.value).toBe(3.18)
    expect(by.ZZZZ.value).toBe(50)
    expect(r.missing).toEqual(['ZZZZ'])
    expect(r.asOf).toBe('2026-11-17')
    expect(r.portfolio.pricesAsOf).toBe('2026-11-17')
    expect(r.changed).toBe(true)
  })
  it('is a no-op the second time', () => {
    const once = revaluePortfolio(portfolio, prices).portfolio
    const twice = revaluePortfolio(once, prices)
    expect(twice.changed).toBe(false)
    expect(twice.portfolio).toBe(once)
  })
  it('never replaces imported values with prices older than the import', () => {
    const old = { closes: { MSFT: [['2026-10-01', 400]] } }
    const r = revaluePortfolio(portfolio, old)
    expect(r.changed).toBe(false)
    expect(r.portfolio.holdings[1].value).toBe(273.98)
  })
})

describe('daily history', () => {
  it('makes one snapshot per trading day from the import date', () => {
    const snaps = dailySnapshots(portfolio, prices)
    expect(snaps.map((s) => s.date)).toEqual(['2026-11-16', '2026-11-17'])
    // 0.523*530 + 2.217*264 + 3.18 + 50 = 277.19 + 585.29 + 53.18
    expect(snaps[0].total).toBeCloseTo(915.66, 2)
    expect(snaps[1].total).toBeCloseTo(282.42 + 587.51 + 53.18, 2)
  })
  it('merges into existing history without duplicates', () => {
    const h = mergeDailyHistory([{ date: '2026-11-16', total: 1 }, { date: '2026-10-01', total: 2 }], dailySnapshots(portfolio, prices))
    expect(h.map((s) => s.date)).toEqual(['2026-10-01', '2026-11-16', '2026-11-17'])
    expect(h[1].total).toBeCloseTo(915.66, 2)
  })
})

describe('dayChange', () => {
  it('totals the move since the previous close', () => {
    const { portfolio: p } = revaluePortfolio(portfolio, prices)
    const d = dayChange(p.holdings)
    expect(d.change).toBeCloseTo(0.523 * 10 + 2.217 * 1, 6)
    expect(d.pct).toBeCloseTo(d.change / (0.523 * 530 + 2.217 * 264), 9)
    expect(dayChange(portfolio.holdings)).toBeNull()
  })
})
