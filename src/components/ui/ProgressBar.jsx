import { clamp01 } from '../../lib/finance.js'

export function ProgressBar({ ratio, over = false, className = '' }) {
  const pct = clamp01(ratio) * 100
  const color = over ? 'bg-red-500' : ratio >= 0.85 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className={`h-2.5 w-full rounded-full bg-slate-200 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
