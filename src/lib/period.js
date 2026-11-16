// Calendar-month helpers. A "month key" is a string like "2026-11".

/** Month key for an ISO date (YYYY-MM-DD) or Date. */
export function monthKey(input) {
  if (input instanceof Date) {
    const m = String(input.getMonth() + 1).padStart(2, '0')
    return `${input.getFullYear()}-${m}`
  }
  return String(input || '').slice(0, 7)
}

export function currentMonthKey(now = new Date()) {
  return monthKey(now)
}

/** Move a month key by `delta` months (negative = earlier). */
export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return monthKey(d)
}

/** "November 2026". */
export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Transactions whose date falls in the given month. */
export function inMonth(transactions, key) {
  return transactions.filter((t) => monthKey(t.date) === key)
}

/** Sum of amounts by category id for the given transactions. */
export function sumByCategory(categories, transactions) {
  const map = {}
  for (const c of categories) map[c.id] = 0
  for (const t of transactions) map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
  return map
}

/** Total spent per month, for the last `count` months ending at `endKey`. */
export function monthlyTotals(transactions, endKey, count = 6) {
  const out = []
  for (let i = count - 1; i >= 0; i--) {
    const key = shiftMonth(endKey, -i)
    const [y, m] = key.split('-').map(Number)
    out.push({
      key,
      label: new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' }),
      spent: inMonth(transactions, key).reduce((s, t) => s + t.amount, 0),
    })
  }
  return out
}
