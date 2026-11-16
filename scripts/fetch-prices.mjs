// Nightly job: download daily closing prices and write prices.json for the app.
// Usage: node scripts/fetch-prices.mjs <out.json>
//   PREVIOUS_URL  optional URL of the currently published prices.json (fallback)
// Never fails the build: if a ticker (or everything) can't be fetched, the
// previously published prices are kept.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { tickerUniverse, yahooSymbol, mergeWithPrevious } from '../src/lib/priceJob.js'
import { parseYahooChart } from '../src/lib/prices.js'

const out = process.argv[2] || 'public/prices.json'
const extras = existsSync('portfolio/tickers.txt') ? readFileSync('portfolio/tickers.txt', 'utf8') : ''
const tickers = tickerUniverse(extras)
const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchSeries(symbol) {
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    const host = HOSTS[attempt % HOSTS.length]
    const url = `https://${host}/v8/finance/chart/${encodeURIComponent(yahooSymbol(symbol))}?range=6mo&interval=1d`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (FinPilot nightly prices)' }, signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { series } = parseYahooChart(await res.json())
      if (!series.length) throw new Error('no closes')
      return series
    } catch (err) {
      lastErr = err
      await sleep(1000 * 2 ** attempt)
    }
  }
  throw lastErr
}

async function previousPrices() {
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
const queue = [...tickers]
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let sym = queue.shift(); sym; sym = queue.shift()) {
      try {
        fresh[sym] = await fetchSeries(sym)
      } catch (err) {
        failed.push(`${sym} (${err.message})`)
      }
    }
  }),
)

const previous = await previousPrices()
const closes = mergeWithPrevious(fresh, previous)
const latest = Object.values(fresh).map((s) => s[s.length - 1][0]).sort().pop() || null

mkdirSync(dirname(out), { recursive: true })
writeFileSync(
  out,
  JSON.stringify({
    updatedAt: new Date().toISOString(),
    latestClose: latest,
    source: 'Yahoo Finance daily closes (unofficial, free)',
    closes,
  }),
)

console.log(`Fetched ${Object.keys(fresh).length}/${tickers.length} tickers; latest close ${latest ?? 'none'}; previous file ${previous ? 'found' : 'not found'}.`)
for (const sym of ['FXAIX', 'AMZN', 'MSFT']) {
  const s = closes[sym]
  if (s?.length) console.log(`  ${sym}: ${s[s.length - 1][0]} close ${s[s.length - 1][1]}`)
}
if (failed.length) console.log(`::warning::Could not fetch ${failed.length} ticker(s): ${failed.join(', ')}`)
if (!Object.keys(fresh).length) console.log('::warning::No prices fetched tonight; kept the previously published prices.')
