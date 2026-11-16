import { describe, it, expect } from 'vitest'
import { normalizeCompany, parseDisplayName, isSameCompany, cikCandidates, stageFromSubmissions, mergeIpoStatus, parseWatchlistFile } from './ipoJob.js'

const submissions = (rows, cik = '1713445') => ({
  cik,
  name: 'Reddit, Inc.',
  filings: {
    recent: {
      form: rows.map((r) => r[0]),
      filingDate: rows.map((r) => r[1]),
      accessionNumber: rows.map((_, i) => `0001628280-24-00${1000 + i}`),
      primaryDocument: rows.map(() => 'doc.htm'),
    },
  },
})

describe('company names', () => {
  it('normalizes legal suffixes and punctuation', () => {
    expect(normalizeCompany('Anthropic, PBC')).toBe('anthropic')
    expect(normalizeCompany('Reddit, Inc.')).toBe('reddit')
    expect(normalizeCompany('Space Exploration Technologies Corp.')).toBe('space exploration technologies')
  })
  it('parses EDGAR display names', () => {
    expect(parseDisplayName('Reddit, Inc.  (RDDT)  (CIK 0001713445)')).toEqual({ name: 'Reddit, Inc.', cik: '1713445' })
    expect(parseDisplayName('Anthropic, PBC  (CIK 0001234567)')).toEqual({ name: 'Anthropic, PBC', cik: '1234567' })
  })
  it('matches the filer itself, not companies that merely mention it', () => {
    expect(isSameCompany('Anthropic, PBC', 'Anthropic')).toBe(true)
    expect(isSameCompany('Reddit Inc', 'reddit')).toBe(true)
    expect(isSameCompany('Redditch Holdings', 'Reddit')).toBe(false)
    expect(isSameCompany('Some AI Corp', 'Anthropic')).toBe(false)
  })
  it('extracts matching CIKs from full-text search hits', () => {
    const json = { hits: { hits: [
      { _source: { display_names: ['Some AI Corp  (CIK 0000000111)'] } }, // mentions Anthropic in its own S-1
      { _source: { display_names: ['Anthropic, PBC  (CIK 0001234567)'] } },
      { _source: { display_names: ['Anthropic, PBC  (CIK 0001234567)'] } },
    ] } }
    expect(cikCandidates(json, 'Anthropic')).toEqual([{ cik: '1234567', name: 'Anthropic, PBC' }])
    expect(cikCandidates(null, 'Anthropic')).toEqual([])
  })
})

describe('stage from filings', () => {
  it('walks DRS -> S-1 -> 424B4', () => {
    expect(stageFromSubmissions(submissions([['DRS', '2023-12-01']])).stage).toBe('confidential')
    expect(stageFromSubmissions(submissions([['DRS', '2023-12-01'], ['S-1', '2024-02-22']]))).toMatchObject({ stage: 'filed', since: '2024-02-22' })
    const priced = stageFromSubmissions(submissions([['S-1', '2024-02-22'], ['S-1/A', '2024-03-11'], ['424B4', '2024-03-21'], ['10-Q', '2024-05-08']]))
    expect(priced).toMatchObject({ stage: 'priced', since: '2024-03-21', form: '424B4' })
    expect(priced.url).toBe('https://www.sec.gov/Archives/edgar/data/1713445/000162828024001002/doc.htm')
  })
  it('detects a withdrawal after the latest registration', () => {
    expect(stageFromSubmissions(submissions([['S-1', '2024-01-10'], ['RW', '2024-06-01']])).stage).toBe('withdrawn')
    expect(stageFromSubmissions(submissions([['S-1', '2022-01-10'], ['RW', '2022-06-01'], ['S-1', '2025-02-01']])).stage).toBe('filed')
  })
  it('returns null for unrelated filings', () => {
    expect(stageFromSubmissions(submissions([['D', '2023-01-01'], ['10-K', '2024-01-01']]))).toBeNull()
    expect(stageFromSubmissions({})).toBeNull()
  })
})

describe('files and merging', () => {
  it('parses the watchlist file', () => {
    expect(parseWatchlistFile('# companies\nAnthropic\n\n  Stripe # payments\nAnthropic\n')).toEqual(['Anthropic', 'Stripe'])
  })
  it('keeps last night’s entry when a company could not be checked', () => {
    const merged = mergeIpoStatus({ anthropic: { stage: 'filed' } }, { companies: { anthropic: { stage: null }, stripe: { stage: 'filed' } } })
    expect(merged).toEqual({ anthropic: { stage: 'filed' }, stripe: { stage: 'filed' } })
  })
})
