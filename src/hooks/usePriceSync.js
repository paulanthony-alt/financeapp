import { useEffect } from 'react'
import { readStored, writeStored } from './useLocalStorage.js'
import { revaluePortfolio, dailySnapshots, mergeDailyHistory } from '../lib/prices.js'

const PRICES_URL = `${import.meta.env.BASE_URL}prices.json`

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

/** Run the sync when the app opens and whenever it comes back to the foreground. */
export function usePriceSync() {
  useEffect(() => {
    let running = false
    const run = () => {
      if (running || document.visibilityState === 'hidden') return
      running = true
      syncPrices().finally(() => {
        running = false
      })
    }
    run()
    document.addEventListener('visibilitychange', run)
    return () => document.removeEventListener('visibilitychange', run)
  }, [])
}
