import { describe, it, expect } from 'vitest'
import { parseCSV, parseNumber, parseFidelityPositions, classifyHolding, summarizePortfolio } from './fidelity.js'

const CSV = `﻿Account Number,Account Name,Symbol,Description,Quantity,Last Price,Current Value,Cost Basis Total
Z1,Individual,SPAXX**,HELD IN MONEY MARKET,,,$2500.00,
Z1,Individual,FXAIX,FIDELITY 500 INDEX FUND,120.5,$210.10,"$25,317.05","$19,117.05"
Z1,Individual,FXNAX,FIDELITY US BOND INDEX FUND,800,$10.50,"$8,400.00",
Z1,Individual,Pending Activity,,,,-$150.00,
X9,ROTH IRA,FXAIX,FIDELITY 500 INDEX FUND,20,$210.10,"$4,202.00",
X9,ROTH IRA,FFFHX,FIDELITY FREEDOM 2050,300,$16.20,"$4,860.00",
X9,ROTH IRA,912797LB1,UNITED STATES TREAS BILLS ZERO CPN,4000,$98.90,"$3,956.00",

"Disclaimer text, with a comma"
`

describe('parseNumber', () => {
  it.each([
    ['-$300.00', -300], ['$1,234.5', 1234.5], ['--', null], ['(45.00)', -45], ['+1.2%', 1.2], ['', null], [undefined, null],
  ])('%s -> %s', (input, out) => expect(parseNumber(input)).toBe(out))
})

describe('parseCSV', () => {
  it('handles quotes, escaped quotes and CRLF', () => {
    expect(parseCSV('a,"b,c","d ""q"""\r\nx,y,z')).toEqual([['a', 'b,c', 'd "q"'], ['x', 'y', 'z']])
  })
})

describe('parseFidelityPositions', () => {
  const { holdings, accountCount } = parseFidelityPositions(CSV)
  it('merges the same symbol across accounts and skips pending/footer rows', () => {
    expect(accountCount).toBe(2)
    expect(holdings.map((h) => h.symbol).sort()).toEqual(['912797LB1', 'FFFHX', 'FXAIX', 'FXNAX', 'SPAXX'])
    expect(holdings.find((h) => h.symbol === 'FXAIX').value).toBe(29519.05)
  })
  it('flags core cash', () => {
    expect(holdings.find((h) => h.symbol === 'SPAXX').coreCash).toBe(true)
  })
  it('rejects files that are not position exports', () => {
    expect(() => parseFidelityPositions('a,b\n1,2')).toThrow(/Fidelity positions export/)
  })
})

describe('cost basis', () => {
  it('sums basis, treating core cash basis as its balance', () => {
    const { holdings } = parseFidelityPositions(CSV)
    expect(holdings.find((h) => h.symbol === 'SPAXX').costBasis).toBe(2500)
    expect(holdings.find((h) => h.symbol === 'FXAIX').costBasis).toBe(19117.05)
  })
  it('hides cost basis when most of the portfolio does not report it', () => {
    const { holdings } = parseFidelityPositions(CSV)
    const s = summarizePortfolio(holdings)
    expect(s.costCoverage).toBeLessThan(0.9)
    expect(s.costBasis).toBeNull()
  })
  it('reports cost basis when coverage is high', () => {
    const csv = `Account Name,Symbol,Description,Quantity,Current Value,Cost Basis Total
A,FXAIX,FIDELITY 500 INDEX FUND,10,"$1,000.00","$800.00"
A,FXNAX,FIDELITY US BOND INDEX FUND,10,"$500.00","$550.00"
`
    const s = summarizePortfolio(parseFidelityPositions(csv).holdings)
    expect(s.costBasis).toBe(1350)
    expect(s.total).toBe(1500)
  })
})

describe('classification and summary', () => {
  it('classifies the common cases', () => {
    expect(classifyHolding({ symbol: 'SPAXX', coreCash: true })).toBe('Cash')
    expect(classifyHolding({ symbol: 'FXNAX', description: 'FIDELITY US BOND INDEX FUND' })).toBe('Bonds')
    expect(classifyHolding({ symbol: '912797LB1', description: 'TREAS BILLS' })).toBe('Bonds')
    expect(classifyHolding({ symbol: 'FFFHX', description: 'FIDELITY FREEDOM 2050' })).toBe('Mixed')
    expect(classifyHolding({ symbol: 'FXAIX', description: 'FIDELITY 500 INDEX FUND' })).toBe('Stocks')
  })
  it('totals by class and honours overrides', () => {
    const { holdings } = parseFidelityPositions(CSV)
    const s = summarizePortfolio(holdings, { FFFHX: 'Stocks' })
    expect(s.total).toBeCloseTo(49235.05, 2)
    expect(s.byClass.Stocks).toBeCloseTo(29519.05 + 4860, 2)
    expect(s.byClass.Mixed).toBe(0)
    expect(s.rows[0].symbol).toBe('FXAIX')
  })
})
