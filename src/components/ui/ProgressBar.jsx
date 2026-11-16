import { clamp01 } from '../../lib/finance.js'

export function ProgressBar({ ratio, over = false, className = '' }) {
  const pct = clamp01(ratio) * 100
  const color = over
    ? 'bg-red-600'
    : ratio >= 0.85
      ? 'bg-gradient-to-r from-gold-400 to-gold-600'
      : 'bg-gradient-to-r from-brand-500 to-brand-700'
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
