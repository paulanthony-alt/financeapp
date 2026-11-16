import { describe, it, expect } from 'vitest'
import { makeImportLink, readImportHash, applyImport } from './importLink.js'

const CSV = `Account Name,Symbol,Description,Quantity,Current Value,Cost Basis Total
Individual,CORE**,HELD IN MONEY MARKET,,$3.18,
Individual,FXAIX,FIDELITY 500 INDEX FUND,2.217,$583.02,$543.11
Individual,MSFT,MICROSOFT CORP,0.523,$273.98,$199.94
`

function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial))
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m }
}

describe('import links', () => {
  it('round-trips a positions file through the URL fragment', () => {
    const link = makeImportLink('https://x.github.io/financeapp/#old', CSV, 'Positions.csv')
    expect(link.startsWith('https://x.github.io/financeapp/#import=')).toBe(true)
    expect(link.split('#import=')[1]).toMatch(/^[A-Za-z0-9_-]+$/) // URL-safe, no padding
    const imp = readImportHash(link.slice(link.indexOf('#')))
    expect(imp.fileName).toBe('Positions.csv')
    expect(imp.holdings.map((h) => h.symbol)).toEqual(['CORE', 'FXAIX', 'MSFT'])
    expect(imp.summary.total).toBeCloseTo(860.18)
  })
  it('keeps non-ASCII text intact', () => {
    const csv = CSV.replace('MICROSOFT CORP', 'MICROSOFT CORP — CAFÉ')
    const link = makeImportLink('https://a/', csv)
    const imp = readImportHash(link.slice(link.indexOf('#')))
    expect(imp.holdings.find((h) => h.symbol === 'MSFT').description).toBe('MICROSOFT CORP — CAFÉ')
  })
  it('ignores ordinary hashes and reports damaged links', () => {
    expect(readImportHash('')).toBeNull()
    expect(readImportHash('#budget')).toBeNull()
    expect(readImportHash('#import=not-base64!!').error).toMatch(/damaged/)
    const link = makeImportLink('https://a/', 'a,b\n1,2')
    expect(readImportHash(link.slice(link.indexOf('#'))).error).toMatch(/damaged/)
  })
  it('saves the portfolio, a history snapshot, and opens the Investing tab', () => {
    const link = makeImportLink('https://a/', CSV, 'P.csv')
    const imp = readImportHash(link.slice(link.indexOf('#')))
    const s = memoryStorage({ 'fp:invest:history': JSON.stringify([{ date: '2026-10-01', total: 500 }]) })
    applyImport(s, imp, new Date('2026-11-16T12:00:00Z'), '2026-11-16')
    const p = JSON.parse(s.getItem('fp:invest:portfolio'))
    expect(p).toMatchObject({ fileName: 'P.csv', importedAt: '2026-11-16T12:00:00.000Z' })
    expect(p.holdings).toHaveLength(3)
    const h = JSON.parse(s.getItem('fp:invest:history'))
    expect(h.map((x) => x.date)).toEqual(['2026-10-01', '2026-11-16'])
    expect(h[1].total).toBeCloseTo(860.18)
    expect(JSON.parse(s.getItem('fp:activeTab'))).toBe('invest')
  })
})
