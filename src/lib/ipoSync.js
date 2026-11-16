// Apply the nightly IPO check (ipo-status.json) to the user's watchlist.
// Only ever moves a company forward (or to withdrawn when a withdrawal is filed
// after its latest step), so manual updates from news are never undone.
import { normalizeCompany } from './ipoJob.js'
import { setStage, stageIndex, stageInfo } from './ipo.js'

/**
 * @returns {{ list, alerts: Array, tracked: string[], changed: boolean }}
 */
export function applyIpoStatus(watchlist, status) {
  const companies = status?.companies || {}
  const alerts = []
  let changed = false

  const list = watchlist.map((c) => {
    const entry = companies[normalizeCompany(c.name)]
    if (!entry) return c
    let next = c
    const auto = { checkedAt: entry.checkedAt || status.updatedAt || null, url: entry.url || null, form: entry.form || null }
    if (JSON.stringify(c.auto) !== JSON.stringify(auto)) next = { ...next, auto }

    if (entry.stage) {
      const lastDate = (c.history || []).reduce((d, h) => (h.date > d ? h.date : d), '')
      const advances = entry.stage === 'withdrawn'
        ? c.stage !== 'withdrawn' && entry.since >= lastDate
        : stageIndex(entry.stage) > stageIndex(c.stage)
      if (advances) {
        next = setStage(next, entry.stage, entry.since || status.updatedAt?.slice(0, 10))
        if (entry.ticker && !next.ticker) next = { ...next, ticker: entry.ticker }
        if (entry.stage === 'trading' && entry.since) next = { ...next, expectedDate: entry.since }
        if (entry.exchange && entry.stage === 'trading' && !next.notes) next = { ...next, notes: entry.exchange }
        alerts.push(makeAlert(c.name, entry))
      }
    }
    if (next !== c) changed = true
    return next
  })

  return { list, alerts, tracked: Object.values(companies).map((e) => e.name), changed }
}

export function makeAlert(name, entry) {
  const when = entry.since ? ` on ${entry.since}` : ''
  const text = {
    trading: `${name} started trading${when}${entry.ticker ? ` as ${entry.ticker}` : ''}${entry.exchange ? ` (${entry.exchange})` : ''}.`,
    priced: `${name} priced its IPO${when}. Trading usually starts the next business day.`,
    filed: `${name} filed publicly to go public${when}. Listing is usually a few weeks away.`,
    confidential: `${name}’s confidential IPO filing${when} is now public on EDGAR.`,
    withdrawn: `${name} withdrew its IPO filing${when}.`,
  }[entry.stage] || `${name} moved to “${stageInfo(entry.stage).label}”${when}.`
  return { id: `${normalizeCompany(name)}:${entry.stage}`, name, stage: entry.stage, text, url: entry.url || null, seen: false }
}

/** Add new alerts, skipping ones already raised (seen or not). */
export function mergeAlerts(existing, incoming) {
  const ids = new Set((existing || []).map((a) => a.id))
  return [...(existing || []), ...incoming.filter((a) => !ids.has(a.id))]
}
