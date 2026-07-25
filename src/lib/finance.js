// Pure finance calculations. No React, no side effects — easy to reason about.

/**
 * Future value of a series with an initial principal plus recurring monthly
 * contributions, compounded monthly.
 *
 * @param {number} principal        starting balance
 * @param {number} monthly          monthly contribution
 * @param {number} annualRatePct    expected annual return, in percent (e.g. 7)
 * @param {number} years            time horizon in years
 * @returns {number} projected balance
 */
export function futureValue(principal, monthly, annualRatePct, years) {
  const months = Math.round(years * 12)
  const r = annualRatePct / 100 / 12
  if (months <= 0) return principal
  if (r === 0) return principal + monthly * months

  const growthPrincipal = principal * Math.pow(1 + r, months)
  const growthContrib = monthly * ((Math.pow(1 + r, months) - 1) / r)
  return growthPrincipal + growthContrib
}

/**
 * Year-by-year projection series for charting.
 * Returns [{ year, invested, balance, growth }] including year 0.
 */
export function projectionSeries(principal, monthly, annualRatePct, years) {
  const r = annualRatePct / 100 / 12
  const series = []
  for (let y = 0; y <= years; y++) {
    const months = y * 12
    let balance
    if (r === 0) {
      balance = principal + monthly * months
    } else {
      balance =
        principal * Math.pow(1 + r, months) +
        monthly * ((Math.pow(1 + r, months) - 1) / r)
    }
    const invested = principal + monthly * months
    series.push({
      year: y,
      invested: Math.round(invested),
      balance: Math.round(balance),
      growth: Math.round(balance - invested),
    })
  }
  return series
}

/**
 * Required monthly saving to reach `target` from `current` by `targetDate`.
 * Ignores investment return (pure savings) — conservative and simple.
 *
 * @returns {number} monthly amount needed (0 if already met)
 */
export function requiredMonthly(target, current, targetDateISO, fromDate = new Date()) {
  const remaining = Math.max(0, target - current)
  if (remaining === 0) return 0
  const months = monthsBetween(fromDate, targetDateISO)
  if (months <= 0) return remaining // past due — need it all now
  return remaining / months
}

/** Whole months (rounded up, min 0) between a date and an ISO target date. */
export function monthsBetween(fromDate, targetISO) {
  const to = new Date(targetISO + (targetISO?.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(to.getTime())) return 0
  const ms = to.getTime() - fromDate.getTime()
  if (ms <= 0) return 0
  const days = ms / (1000 * 60 * 60 * 24)
  return Math.max(1, Math.ceil(days / 30.4375))
}

/** Clamp a ratio into 0..1. */
export function clamp01(x) {
  if (!Number.isFinite(x)) return 0
  return Math.min(1, Math.max(0, x))
}
