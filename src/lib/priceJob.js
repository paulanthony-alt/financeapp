// Helpers for the nightly price job (scripts/fetch-prices.mjs). Pure functions.
import { FUNDS, SP500_GIANTS } from './funds.js'

/**
 * Tickers to fetch: the app's reference funds and large companies, plus any
 * extras listed in portfolio/tickers.txt. The published list is this whole set,
 * so it doesn't single out what you actually hold.
 */
export function tickerUniverse(extraText = '') {
  const extras = extraText
    .split('\n')
    .map((l) => l.replace(/#.*/, '').trim().toUpperCase())
    .filter((t) => /^[A-Z][A-Z0-9.\-]{0,9}$/.test(t))
  const funds = Object.entries(FUNDS)
    .filter(([, f]) => f.tracks !== 'cash')
    .map(([sym]) => sym)
  return [...new Set([...funds, ...SP500_GIANTS, ...extras])].sort()
}

/** Yahoo writes share classes with a dash: BRK.B -> BRK-B. */
export function yahooSymbol(symbol) {
  return symbol.replace(/\./g, '-')
}

/**
 * Combine fresh results with the previously published file so one bad night
 * (or one failed ticker) never wipes out prices the app already had.
 * @param fresh     { [symbol]: series }  successes only
 * @param previous  last published prices.json, or null
 */
export function mergeWithPrevious(fresh, previous, keepDays = 400) {
  const closes = { ...(previous?.closes || {}) }
  for (const [sym, series] of Object.entries(fresh)) {
    // Fresh data is authoritative: anything in the old file dated after it (e.g.
    // a mid-day price published by a daytime run) is dropped.
    const freshEnd = series.length ? series[series.length - 1][0] : ''
    const old = (closes[sym] || []).filter(([d]) => d <= freshEnd)
    const byDate = new Map(old)
    for (const [d, c] of series) byDate.set(d, c)
    closes[sym] = [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-keepDays)
  }
  return closes
}
