// Dated snapshots of the imported Fidelity portfolio and of net worth.

/** Insert or replace the snapshot for `snap.date`; keeps the list sorted by date. */
export function upsertSnapshot(history, snap) {
  const rest = (history || []).filter((s) => s.date !== snap.date)
  return [...rest, snap].sort((a, b) => (a.date < b.date ? -1 : 1))
}

/** Portfolio snapshot from a summarizePortfolio() result. */
export function portfolioSnapshot(date, summary) {
  const byClass = {}
  for (const [k, v] of Object.entries(summary.byClass)) byClass[k] = Math.round(v * 100) / 100
  const snap = { date, total: Math.round(summary.total * 100) / 100, byClass, holdings: summary.rows.length }
  if (summary.costBasis != null) snap.costBasis = Math.round(summary.costBasis * 100) / 100
  return snap
}

/** Change between the first and last snapshot. */
export function historyChange(history) {
  if (!history || history.length < 2) return null
  const first = history[0]
  const last = history[history.length - 1]
  const change = last.total - first.total
  return { change, pct: first.total > 0 ? change / first.total : 0, from: first.date, to: last.date }
}

/** Net worth = assets + invested portfolio - debts. */
export function computeNetWorth(items, invested = 0) {
  let assets = invested
  let debts = 0
  for (const it of items || []) {
    const v = Number(it.value) || 0
    if (it.kind === 'debt') debts += v
    else assets += v
  }
  return { assets, debts, net: assets - debts, invested }
}
