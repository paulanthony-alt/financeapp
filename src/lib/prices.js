// Daily closing prices: parse them, revalue the imported portfolio with them,
// and build a value-per-trading-day history. Pure functions; the nightly job
// (scripts/fetch-prices.mjs) and the app both use this file.
import { summarizePortfolio } from './fidelity.js'
import { portfolioSnapshot, upsertSnapshot } from './history.js'

// US markets close at 4:00 pm; allow a little time for the official close.
const CLOSE_MINUTES = 16 * 60 + 15

/**
 * Yahoo Finance chart API response -> { symbol, series: [[date, close], ...] }.
 * Dates are the exchange's local trading date. Bars with no close are skipped,
 * and so is today's bar while the market is still open (it's not a close yet).
 */
export function parseYahooChart(json, now = Date.now()) {
  const r = json?.chart?.result?.[0]
  if (!r || !Array.isArray(r.timestamp)) throw new Error(json?.chart?.error?.description || 'no chart data')
  const offset = r.meta?.gmtoffset || 0
  const closes = r.indicators?.quote?.[0]?.close || []
  const byDate = new Map()
  r.timestamp.forEach((ts, i) => {
    const c = closes[i]
    if (typeof c !== 'number' || !Number.isFinite(c) || c <= 0) return
    const date = new Date((ts + offset) * 1000).toISOString().slice(0, 10)
    byDate.set(date, Math.round(c * 10000) / 10000) // last bar of a date wins
  })
  const series = [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const local = new Date(now + offset * 1000)
  const localDate = local.toISOString().slice(0, 10)
  const localMinutes = local.getUTCHours() * 60 + local.getUTCMinutes()
  if (series.length && series[series.length - 1][0] === localDate && localMinutes < CLOSE_MINUTES) series.pop()
  return { symbol: r.meta?.symbol, series }
}

/** Close on `date`, or the latest one before it. */
export function closeOn(series, date) {
  let found = null
  for (const [d, c] of series || []) {
    if (d <= date) found = [d, c]
    else break
  }
  return found
}

const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
// Closes older than this many days before the import are older than the imported
// values themselves, so they're never used to "update" them.
const STALE_BEFORE_IMPORT_DAYS = 4

/**
 * Revalue holdings with the latest closes. Holdings without a price (cash,
 * unknown tickers) or without a share count keep their imported value.
 * @returns {{ portfolio, asOf, missing: string[], changed: boolean }}
 */
export function revaluePortfolio(portfolio, prices) {
  const importDate = portfolio.importedAt.slice(0, 10)
  const closes = prices?.closes || {}
  let asOf = null
  let changed = false
  const missing = []

  const holdings = portfolio.holdings.map((h) => {
    const series = closes[h.symbol]
    const priced = h.quantity > 0 && !h.coreCash
    if (!priced) return h
    if (!series?.length) {
      missing.push(h.symbol)
      return h
    }
    const [date, close] = series[series.length - 1]
    if (daysBetween(date, importDate) > STALE_BEFORE_IMPORT_DAYS) return h
    const prev = series.length > 1 ? series[series.length - 2][1] : null
    const value = Math.round(h.quantity * close * 100) / 100
    if (!asOf || date > asOf) asOf = date
    if (value !== h.value || h.priceDate !== date) changed = true
    return { ...h, value, price: close, priceDate: date, prevClose: prev }
  })

  return {
    portfolio: changed ? { ...portfolio, holdings, pricesAsOf: asOf } : portfolio,
    asOf,
    missing,
    changed,
  }
}

/**
 * One snapshot per trading day from the import date through the latest close,
 * valuing today's share counts at each day's close.
 */
export function dailySnapshots(portfolio, prices, overrides = {}) {
  const importDate = portfolio.importedAt.slice(0, 10)
  const closes = prices?.closes || {}
  const priced = portfolio.holdings.filter((h) => h.quantity > 0 && !h.coreCash && closes[h.symbol]?.length)
  if (!priced.length) return []
  const dates = new Set()
  for (const h of priced) for (const [d] of closes[h.symbol]) if (d >= importDate) dates.add(d)

  return [...dates].sort().map((date) => {
    const holdings = portfolio.holdings.map((h) => {
      const hit = priced.includes(h) ? closeOn(closes[h.symbol], date) : null
      return hit ? { ...h, value: Math.round(h.quantity * hit[1] * 100) / 100 } : h
    })
    return portfolioSnapshot(date, summarizePortfolio(holdings, overrides))
  })
}

/** Add daily snapshots to an existing history. */
export function mergeDailyHistory(history, snaps) {
  return snaps.reduce((h, s) => upsertSnapshot(h, s), history || [])
}

/** Day change across priced holdings, from each one's previous close. */
export function dayChange(holdings) {
  let change = 0
  let base = 0
  for (const h of holdings) {
    if (h.prevClose == null || h.price == null) continue
    change += h.quantity * (h.price - h.prevClose)
    base += h.quantity * h.prevClose
  }
  return base > 0 ? { change, pct: change / base } : null
}
