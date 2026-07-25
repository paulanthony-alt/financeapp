// Formatting helpers shared across the app.

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const currencyFmtCents = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percentFmt = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
})

/** Format a number as whole-dollar currency, e.g. $1,240. */
export function money(n) {
  if (!Number.isFinite(n)) return '$0'
  return currencyFmt.format(n)
}

/** Format a number as currency with cents, e.g. $1,240.50. */
export function moneyCents(n) {
  if (!Number.isFinite(n)) return '$0.00'
  return currencyFmtCents.format(n)
}

/** Format a 0..1 ratio as a percent, e.g. 0.42 -> 42%. */
export function percent(ratio) {
  if (!Number.isFinite(ratio)) return '0%'
  return percentFmt.format(ratio)
}

/** Format an ISO date string (YYYY-MM-DD) into a readable form. */
export function prettyDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Today's date as an ISO YYYY-MM-DD string (local time). */
export function todayISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

/** Small unique id generator good enough for local-only data. */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
