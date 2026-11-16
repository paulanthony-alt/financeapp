import { clamp01 } from '../../lib/finance.js'

// A "coin stack" progress bar: striped gold/green fill inside an inked tube.
export function ProgressBar({ ratio, over = false, className = '' }) {
  const pct = clamp01(ratio) * 100
  const fill = over
    ? 'linear-gradient(180deg,#f87171,#b91c1c)'
    : ratio >= 0.85
      ? 'linear-gradient(180deg,#fde68a,#f0b429 55%,#cb6e17)'
      : 'linear-gradient(180deg,#6fd59a,#157f49 60%,#0f5132)'
  return (
    <div
      className={`h-3.5 w-full overflow-hidden rounded-full border-2 border-ink bg-slate-100 ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,.28) 0 2px, transparent 2px 10px), ${fill}`,
        }}
      />
    </div>
  )
}
