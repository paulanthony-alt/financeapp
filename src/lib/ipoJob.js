// Helpers for the nightly IPO check (scripts/fetch-ipo-status.mjs). Pure functions.
// Stages come from SEC EDGAR filings: S-1/F-1 = filed publicly, 424B4 (final
// prospectus) = priced, RW = withdrawn, DRS (once released) = filed confidentially.
// "Trading" is confirmed separately from live market data.

const SUFFIXES = /\b(inc|incorporated|corp|corporation|co|company|pbc|ltd|limited|llc|plc|holdings?|group|n ?v|s ?a)\b/g

/** Lowercase, drop punctuation and legal suffixes: "Anthropic, PBC" -> "anthropic". */
export function normalizeCompany(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[.,'’&()/-]/g, ' ')
    .replace(SUFFIXES, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** EDGAR full-text-search display name: "Reddit, Inc.  (RDDT)  (CIK 0001713445)". */
export function parseDisplayName(display) {
  const s = String(display || '')
  const cik = s.match(/\(CIK\s*0*(\d+)\)/i)?.[1] || null
  const name = s.split(/\s{2,}\(|\s\(CIK/i)[0].trim()
  return { name, cik }
}

/** Is this filer the watched company (not just a filing that mentions it)? */
export function isSameCompany(filerName, watchName) {
  const a = normalizeCompany(filerName)
  const b = normalizeCompany(watchName)
  return !!b && (a === b || a.startsWith(`${b} `))
}

/** Pull matching filers' CIKs out of a full-text-search response. */
export function cikCandidates(searchJson, watchName) {
  const found = new Map()
  for (const hit of searchJson?.hits?.hits || []) {
    for (const display of hit?._source?.display_names || []) {
      const { name, cik } = parseDisplayName(display)
      if (cik && isSameCompany(name, watchName)) found.set(cik, name)
    }
  }
  return [...found.entries()].map(([cik, name]) => ({ cik, name }))
}

const FILED = new Set(['S-1', 'F-1', 'S-1/A', 'F-1/A'])

/**
 * Stage from a company's EDGAR submissions (data.sec.gov/submissions/CIK*.json).
 * @returns {{ stage, since, form, url } | null}  null = nothing IPO-related
 */
export function stageFromSubmissions(sub) {
  const r = sub?.filings?.recent
  if (!r?.form) return null
  const cik = String(sub.cik || '').replace(/^0+/, '')
  const filings = r.form.map((form, i) => ({
    form,
    date: r.filingDate[i],
    url: r.accessionNumber?.[i] && cik
      ? `https://www.sec.gov/Archives/edgar/data/${cik}/${r.accessionNumber[i].replace(/-/g, '')}/${r.primaryDocument?.[i] || ''}`
      : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}`,
  }))
  const first = (pred) => filings.filter(pred).sort((a, b) => (a.date < b.date ? -1 : 1))[0]
  const last = (pred) => filings.filter(pred).sort((a, b) => (a.date < b.date ? 1 : -1))[0]

  const priced = first((f) => f.form === '424B4')
  const filed = first((f) => FILED.has(f.form))
  const withdrawn = last((f) => f.form === 'RW')
  const drs = first((f) => f.form === 'DRS')
  const pick = (f, stage) => ({ stage, since: f.date, form: f.form, url: f.url })

  // A withdrawal after the latest registration (and before any pricing) wins.
  const latestReg = last((f) => FILED.has(f.form))
  if (withdrawn && !priced && (!latestReg || withdrawn.date >= latestReg.date)) return pick(withdrawn, 'withdrawn')
  if (priced) return pick(priced, 'priced')
  if (filed) return pick(filed, 'filed')
  if (drs) return pick(drs, 'confidential')
  return null
}

/** Keep the previous night's entry for any company that couldn't be checked tonight. */
export function mergeIpoStatus(fresh, previous) {
  const companies = { ...(previous?.companies || {}) }
  for (const [key, entry] of Object.entries(fresh)) companies[key] = entry
  return companies
}

/** Watchlist file: one company per line, # comments allowed. */
export function parseWatchlistFile(text) {
  return [...new Set(String(text || '').split('\n').map((l) => l.replace(/#.*/, '').trim()).filter(Boolean))]
}
