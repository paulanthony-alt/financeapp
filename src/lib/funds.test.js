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

describe('individual stocks', () => {
  const row = (symbol, description, value = 100) => ({ symbol, description, value })
  it('tells company shares apart from funds', async () => {
    const { isIndividualStock } = await import('./funds.js')
    expect(isIndividualStock(row('AMZN', 'AMAZON.COM INC'))).toBe(true)
    expect(isIndividualStock(row('GOOGL', 'ALPHABET INC CAP STK CL A'))).toBe(true)
    expect(isIndividualStock(row('NVDA', 'NVIDIA CORPORATION COM'))).toBe(true)
    expect(isIndividualStock(row('BRK.B', 'BERKSHIRE HATHAWAY INC CL B'))).toBe(true)
    expect(isIndividualStock(row('FXAIX', 'FIDELITY 500 INDEX FUND'))).toBe(false)
    expect(isIndividualStock(row('XYZQX', 'SOME GROWTH FUND INC'))).toBe(false)
    expect(isIndividualStock(row('IWM', 'ISHARES RUSSELL 2000 ETF'))).toBe(false)
    expect(isIndividualStock(row('CORE', 'HELD IN MONEY MARKET'))).toBe(false)
    expect(isIndividualStock(row('912797LB1', 'UNITED STATES TREAS BILLS'))).toBe(false)
  })
  it('gives stocks a zero fee instead of asking', () => {
    const r = fundCosts([row('MSFT', 'MICROSOFT CORP', 1000), row('FXAIX', 'FIDELITY 500 INDEX FUND', 1000)])
    expect(r.rows[0]).toMatchObject({ er: 0, cost: 0, source: 'stock' })
    expect(r.unknown).toEqual([])
    expect(r.coverage).toBe(1)
  })
})

describe('stock overlap and concentration', () => {
  const r = (symbol, description, value) => ({ symbol, description, value })
  // Shaped like a typical "index fund plus big tech" portfolio.
  const portfolio = [
    r('FXAIX', 'FIDELITY 500 INDEX FUND', 300),
    r('AMZN', 'AMAZON.COM INC', 180),
    r('MSFT', 'MICROSOFT CORP', 130),
    r('META', 'META PLATFORMS INC', 100),
    r('NVDA', 'NVIDIA CORPORATION COM', 100),
    r('TSLA', 'TESLA INC COM', 95),
    r('GOOGL', 'ALPHABET INC CAP STK CL A', 95),
  ]
  it('flags stocks also held inside an index fund', () => {
    const w = overlapWarnings(portfolio).find((x) => x.kind === 'in-index')
    expect(w.text).toMatch(/^AMZN, MSFT, META, NVDA, TSLA and GOOGL are also among the largest companies inside FXAIX/)
  })
  it('flags heavy concentration in individual companies', () => {
    const w = overlapWarnings(portfolio).find((x) => x.kind === 'single-stocks')
    expect(w.text).toMatch(/^70% of this portfolio is in 6 individual companies\. Positions over 10%: AMZN 18%, MSFT 13%, META 10%, NVDA 10%\./)
  })
  it('stays quiet about a small stock position', () => {
    const kinds = overlapWarnings([r('FXAIX', 'FIDELITY 500 INDEX FUND', 900), r('AAPL', 'APPLE INC', 100)]).map((x) => x.kind)
    expect(kinds).toEqual(['in-index'])
    expect(overlapWarnings([r('AAPL', 'APPLE INC', 100)])).toEqual([{ kind: 'single-stocks', symbols: ['AAPL'], text: expect.stringMatching(/^100% .* 1 individual company\. Positions over 10%: AAPL 100%/) }])
  })
})
