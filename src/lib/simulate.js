// Projection helpers beyond the single straight line: inflation, a range of
// outcomes (Monte Carlo), and a retirement target.

/** Assumed yearly volatility (standard deviation, %) for an expected return.
 *  A simple, documented rule of thumb: 4.5% -> 7, 6.5% -> 11, 8.5% -> 15. */
export function volatilityFor(expectedReturnPct) {
  return Math.min(18, Math.max(3, 2 * expectedReturnPct - 2))
}

/** Deterministic PRNG (mulberry32) so the same inputs always draw the same chart. */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normal(rand) {
  // Box-Muller
  let u = 0
  while (u === 0) u = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
}

function quantile(sorted, q) {
  if (!sorted.length) return 0
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

/**
 * Simulate many possible paths. Each year draws one annual return from a normal
 * distribution (floored at -95%), compounded monthly with monthly contributions,
 * so with zero volatility every path equals futureValue().
 *
 * @returns {{ years: Array<{year, p10, p50, p90}>, perYear: Float64Array[], inflationPct: number }}
 *   `years` is in today's dollars when inflationPct > 0; `perYear` holds every
 *   path's nominal balance by year (for shareReaching)
 */
export function monteCarlo({
  principal,
  monthly,
  meanPct,
  volPct,
  years,
  runs = 1000,
  seed = 1,
  inflationPct = 0,
}) {
  const rand = rng(seed)
  const n = Math.max(0, Math.round(years))
  const perYear = Array.from({ length: n + 1 }, () => new Float64Array(runs))

  for (let r = 0; r < runs; r++) {
    let bal = principal
    perYear[0][r] = bal
    for (let y = 1; y <= n; y++) {
      const annual = Math.max(-0.95, meanPct / 100 + (volPct / 100) * normal(rand))
      const m = annual / 12 // same monthly convention as futureValue()
      for (let k = 0; k < 12; k++) bal = bal * (1 + m) + monthly
      perYear[y][r] = bal
    }
  }

  const out = perYear.map((arr, y) => {
    const s = Array.from(arr).sort((a, b) => a - b)
    const d = Math.pow(1 + inflationPct / 100, y)
    return {
      year: y,
      p10: Math.round(quantile(s, 0.1) / d),
      p50: Math.round(quantile(s, 0.5) / d),
      p90: Math.round(quantile(s, 0.9) / d),
    }
  })
  return { years: out, perYear, inflationPct }
}

/** Share of simulated paths at or above `target` in a given year, compared in the
 *  same dollars as the simulation's `years` (today's dollars if it used inflation). */
export function shareReaching(sim, target, year) {
  const arr = sim.perYear[year]
  if (!arr) return 0
  const d = Math.pow(1 + sim.inflationPct / 100, year)
  let hit = 0
  for (const v of arr) if (v / d >= target) hit++
  return hit / arr.length
}

/** First year a series (e.g. the median p50) reaches `target`, or null. */
export function firstYearReaching(series, key, target) {
  const row = series.find((r) => r[key] >= target)
  return row ? row.year : null
}

/** Nest egg needed to spend `annualSpending` at `withdrawalPct` a year. */
export function retirementTarget(annualSpending, withdrawalPct) {
  if (!(withdrawalPct > 0)) return 0
  return annualSpending / (withdrawalPct / 100)
}

/** Convert a nominal amount `years` from now into today's dollars. */
export function toTodaysDollars(amount, inflationPct, years) {
  return amount / Math.pow(1 + inflationPct / 100, years)
}
