// Recurring transactions. A rule creates one real transaction per month,
// tagged with `recurringId` + `recurringMonth` so it is never created twice.
// If you delete a generated transaction, that month is added to the rule's
// `skipped` list so it doesn't come back.
import { monthKey, shiftMonth } from './period.js'

function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** ISO date for a rule's day-of-month in a month (clamped, so day 31 -> Feb 28). */
export function dateForMonth(rule, key) {
  const day = Math.min(Math.max(1, rule.dayOfMonth || 1), daysInMonth(key))
  return `${key}-${String(day).padStart(2, '0')}`
}

/**
 * Transactions that should exist for the rules through `throughKey` (inclusive)
 * but don't yet. Never generates dates in the future of `today`.
 */
export function dueTransactions(rules, transactions, throughKey, today, makeId) {
  const have = new Set(
    transactions.filter((t) => t.recurringId).map((t) => `${t.recurringId}|${t.recurringMonth}`),
  )
  const out = []
  for (const rule of rules) {
    if (rule.active === false) continue
    const skipped = new Set(rule.skipped || [])
    let key = rule.startMonth
    let guard = 0
    while (key <= throughKey && guard++ < 600) {
      const date = dateForMonth(rule, key)
      if (date <= today && !skipped.has(key) && !have.has(`${rule.id}|${key}`)) {
        out.push({
          id: makeId(),
          description: rule.description,
          amount: rule.amount,
          categoryId: rule.categoryId,
          date,
          recurringId: rule.id,
          recurringMonth: key,
        })
      }
      key = shiftMonth(key, 1)
    }
  }
  return out
}

/** Record that a generated transaction was deliberately removed. */
export function skipMonth(rules, recurringId, month) {
  return rules.map((r) =>
    r.id === recurringId && !(r.skipped || []).includes(month)
      ? { ...r, skipped: [...(r.skipped || []), month] }
      : r,
  )
}

export { monthKey }
