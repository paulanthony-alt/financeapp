import { useEffect } from 'react'
import { readStored, writeStored } from './useLocalStorage.js'
import { revaluePortfolio, dailySnapshots, mergeDailyHistory } from '../lib/prices.js'
import { applyIpoStatus, mergeAlerts } from '../lib/ipoSync.js'
import { DEFAULT_WATCHLIST } from '../lib/ipo.js'
import { todayISO } from '../lib/format.js'

const PRICES_URL = `${import.meta.env.BASE_URL}prices.json`
const IPO_URL = `${import.meta.env.BASE_URL}ipo-status.json`

/** Fetch the nightly closing prices and apply them to the imported portfolio. */
export async function syncPrices(fetchImpl = fetch) {
  const portfolio = readStored('fp:invest:portfolio')
  if (!portfolio?.holdings?.length) return { status: 'no-portfolio' }

  let prices
  try {
    const res = await fetchImpl(PRICES_URL, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    prices = await res.json()
  } catch {
    return { status: 'unavailable' }
  }

  const result = revaluePortfolio(portfolio, prices)
  if (result.changed) writeStored('fp:invest:portfolio', result.portfolio)

  const overrides = readStored('fp:invest:classOverrides', {})
  const history = readStored('fp:invest:history', [])
  const merged = mergeDailyHistory(history, dailySnapshots(result.portfolio, prices, overrides))
  if (JSON.stringify(merged) !== JSON.stringify(history)) writeStored('fp:invest:history', merged)

  writeStored('fp:prices:status', {
    checkedAt: new Date().toISOString(),
    asOf: result.asOf,
    updatedAt: prices.updatedAt || null,
    missing: result.missing,
  })
  return { status: 'ok', ...result }
}

/** Fetch the nightly IPO check and move watchlist companies forward. */
export async function syncIpo(fetchImpl = fetch) {
  let status
  try {
    const res = await fetchImpl(IPO_URL, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    status = await res.json()
  } catch {
    return { status: 'unavailable' }
  }
  const watchlist = readStored('fp:ipo:watchlist') || DEFAULT_WATCHLIST(todayISO())
  const result = applyIpoStatus(watchlist, status)
  if (result.changed) writeStored('fp:ipo:watchlist', result.list)
  if (result.alerts.length) writeStored('fp:ipo:alerts', mergeAlerts(readStored('fp:ipo:alerts', []), result.alerts))
  writeStored('fp:ipo:tracked', { names: result.tracked, updatedAt: status.updatedAt || null })
  return { status: 'ok', ...result }
}

/** Run the sync when the app opens and whenever it comes back to the foreground. */
export function usePriceSync() {
  useEffect(() => {
    let running = false
    const run = () => {
      if (running || document.visibilityState === 'hidden') return
      running = true
      Promise.allSettled([syncPrices(), syncIpo()]).finally(() => {
        running = false
      })
    }
    run()
    document.addEventListener('visibilitychange', run)
    return () => document.removeEventListener('visibilitychange', run)
  }, [])
}
