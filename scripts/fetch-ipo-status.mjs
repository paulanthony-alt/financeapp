// Nightly job: check SEC EDGAR (and live market data) for each company on the
// IPO watchlist and write ipo-status.json for the app.
// Usage: node scripts/fetch-ipo-status.mjs <out.json>
//   PREVIOUS_URL  optional URL of the currently published ipo-status.json
//   IPO_EXTRA     optional comma-separated extra companies (for testing)
// Never fails the build: companies that can't be checked keep last night's entry.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { parseWatchlistFile, cikCandidates, stageFromSubmissions, mergeIpoStatus, normalizeCompany } from '../src/lib/ipoJob.js'
import { stageIndex } from '../src/lib/ipo.js'

const out = process.argv[2] || 'public/ipo-status.json'
const names = [
  ...parseWatchlistFile(existsSync('portfolio/ipo-watchlist.txt') ? readFileSync('portfolio/ipo-watchlist.txt', 'utf8') : ''),
  ...(process.env.IPO_EXTRA || '').split(',').map((s) => s.trim()).filter(Boolean),
]
// The SEC requires automated tools to declare themselves with a contact email in
// the User-Agent and to stay under 10 requests/second; undeclared tools get 403.
// SEC_CONTACT comes from the repository variable of the same name.
const contact = process.env.SEC_CONTACT
if (!contact) {
  console.log('::warning::SEC_CONTACT is not set (repository variable); skipping the IPO check and keeping last night’s results.')
}
const SEC_HEADERS = { 'User-Agent': `FinPilot personal finance app ${contact}`, Accept: 'application/json' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(url, headers = SEC_HEADERS) {
  await sleep(250)
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${new URL(url).host}`)
  return res.json()
}

async function tradingInfo(ticker) {
  const json = await getJson(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker.replace(/\./g, '-'))}?range=5d&interval=1d`,
    { 'User-Agent': 'Mozilla/5.0 (FinPilot nightly IPO check)' },
  )
  const r = json?.chart?.result?.[0]
  if (!r?.timestamp?.length) return null
  const first = r.meta?.firstTradeDate
  return {
    exchange: r.meta?.fullExchangeName || r.meta?.exchangeName || null,
    firstTradeDate: first ? new Date((first + (r.meta?.gmtoffset || 0)) * 1000).toISOString().slice(0, 10) : null,
  }
}

async function checkCompany(name) {
  const q = encodeURIComponent(`"${name}"`)
  const search = await getJson(`https://efts.sec.gov/LATEST/search-index?q=${q}&forms=S-1,F-1,424B4,DRS,RW`)
  const candidates = cikCandidates(search, name).slice(0, 3)
  let best = null
  for (const { cik, name: filerName } of candidates) {
    const sub = await getJson(`https://data.sec.gov/submissions/CIK${cik.padStart(10, '0')}.json`)
    const found = stageFromSubmissions(sub)
    if (!found) continue
    const entry = { ...found, cik, filerName: sub.name || filerName, tickers: sub.tickers || [], exchanges: sub.exchanges || [] }
    if (!best || stageIndex(entry.stage) > stageIndex(best.stage)) best = entry
  }
  const base = { name, checkedAt: new Date().toISOString() }
  if (!best) return { ...base, stage: null, candidates: candidates.length }

  const { tickers, exchanges, ...rest } = best
  if (tickers.length && ['priced', 'filed'].includes(best.stage)) {
    const live = await tradingInfo(tickers[0]).catch(() => null)
    if (live) {
      return {
        ...base,
        ...rest,
        stage: 'trading',
        ticker: tickers[0],
        exchange: live.exchange || exchanges[0] || null,
        since: live.firstTradeDate || best.since,
        pricedOn: best.stage === 'priced' ? best.since : null,
      }
    }
  }
  return { ...base, ...rest, ticker: tickers[0] || null }
}

async function previousStatus() {
  if (!process.env.PREVIOUS_URL) return null
  try {
    const res = await fetch(process.env.PREVIOUS_URL, { signal: AbortSignal.timeout(15000) })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

const fresh = {}
const failed = []
for (const name of contact ? names : []) {
  try {
    fresh[normalizeCompany(name)] = await checkCompany(name)
  } catch (err) {
    failed.push(`${name} (${err.message})`)
  }
}

const previous = await previousStatus()
const companies = mergeIpoStatus(fresh, previous)
// Only publish companies that are on the watchlist now.
const keep = new Set(names.map(normalizeCompany))
for (const key of Object.keys(companies)) if (!keep.has(key)) delete companies[key]

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify({ updatedAt: new Date().toISOString(), source: 'SEC EDGAR filings + Yahoo Finance', companies }))

console.log(`Checked ${Object.keys(fresh).length}/${names.length} companies; previous file ${previous ? 'found' : 'not found'}.`)
for (const c of Object.values(companies)) {
  console.log(`  ${c.name}: ${c.stage ?? 'no IPO filings found'}${c.since ? ` since ${c.since}` : ''}${c.ticker ? ` (${c.ticker}${c.exchange ? `, ${c.exchange}` : ''})` : ''}${c.form ? ` [${c.form}]` : ''}`)
}
if (failed.length) console.log(`::warning::Could not check ${failed.length} compan${failed.length === 1 ? 'y' : 'ies'}: ${failed.join(', ')}`)
