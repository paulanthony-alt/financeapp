// Rebalance with new money only: no selling, so no taxable sales.
//
// Given current values and target weights, split a contribution so the portfolio
// ends up as close to target as possible. Uses "water-filling": raise every
// asset class toward the same fraction of its target, starting with the most
// underweight, until the money runs out.

/**
 * @param {Record<string, number>} current  dollars per asset class
 * @param {Record<string, number>} target   target percent per asset class (any scale)
 * @param {number} contribution             new money to invest
 * @returns {{ buys: Record<string, number>, after: Record<string, number>,
 *            afterPct: Record<string, number>, needed: number }}
 *   `needed` is the contribution that would bring every class exactly to target.
 */
export function rebalanceWithContribution(current, target, contribution) {
  const classes = Object.keys(target).filter((k) => target[k] > 0)
  const weightSum = classes.reduce((s, k) => s + target[k], 0)
  const w = Object.fromEntries(classes.map((k) => [k, target[k] / weightSum]))
  const cur = Object.fromEntries(classes.map((k) => [k, Math.max(0, current[k] || 0)]))
  const total = classes.reduce((s, k) => s + cur[k], 0)
  const money = Math.max(0, contribution || 0)

  // Smallest total at which nothing is overweight: every class already at or
  // below its target share.
  const needed = Math.max(0, Math.max(...classes.map((k) => cur[k] / w[k])) - total)

  // Water level L (a portfolio total): class k gets max(0, w_k * L - cur_k).
  // Find L so the buys add up to the contribution.
  const order = [...classes].sort((a, b) => cur[a] / w[a] - cur[b] / w[b])
  let buys = Object.fromEntries(classes.map((k) => [k, 0]))
  if (money > 0) {
    let level = 0
    let filledW = 0
    let filledCur = 0
    for (let i = 0; i < order.length; i++) {
      const k = order[i]
      filledW += w[k]
      filledCur += cur[k]
      const candidate = (money + filledCur) / filledW
      const nextThreshold = i + 1 < order.length ? cur[order[i + 1]] / w[order[i + 1]] : Infinity
      if (candidate <= nextThreshold) {
        level = candidate
        break
      }
    }
    for (const k of classes) buys[k] = Math.max(0, w[k] * level - cur[k])
    // Tidy rounding so buys sum to exactly the contribution (in cents).
    buys = roundToCents(buys, money)
  }

  const after = Object.fromEntries(classes.map((k) => [k, cur[k] + buys[k]]))
  const afterTotal = total + money
  const afterPct = Object.fromEntries(
    classes.map((k) => [k, afterTotal > 0 ? (after[k] / afterTotal) * 100 : 0]),
  )
  return { buys, after, afterPct, needed }
}

function roundToCents(buys, total) {
  const keys = Object.keys(buys)
  const cents = Object.fromEntries(keys.map((k) => [k, Math.floor(buys[k] * 100)]))
  let diff = Math.round(total * 100) - keys.reduce((s, k) => s + cents[k], 0)
  // Hand leftover cents to the largest buys.
  const byAmount = [...keys].sort((a, b) => buys[b] - buys[a])
  for (let i = 0; diff > 0 && byAmount.length; i = (i + 1) % byAmount.length, diff--) {
    cents[byAmount[i]] += 1
  }
  return Object.fromEntries(keys.map((k) => [k, cents[k] / 100]))
}

/**
 * Fold multi-asset (target-date/balanced) funds into stocks and bonds using the
 * stock share the user gives, so they can be compared with a 3-class target.
 */
export function lookThroughMixed(byClass, mixedStockPct) {
  const mixed = byClass.Mixed || 0
  const s = Math.min(100, Math.max(0, mixedStockPct)) / 100
  return {
    Stocks: (byClass.Stocks || 0) + mixed * s,
    Bonds: (byClass.Bonds || 0) + mixed * (1 - s),
    Cash: byClass.Cash || 0,
  }
}

/** The holding to suggest adding to for each class: the largest you already own. */
export function suggestedFunds(rows) {
  const best = {}
  for (const r of rows) {
    if (r.cls === 'Mixed') continue
    if (!best[r.cls] || r.value > best[r.cls].value) best[r.cls] = r
  }
  return best
}
