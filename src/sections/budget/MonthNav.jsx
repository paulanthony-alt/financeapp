import { monthLabel } from '../../lib/period.js'
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons.jsx'

export default function MonthNav({ month, current, onChange, shift }) {
  const atCurrent = month >= current
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center border border-slate-200 bg-white shadow-card">
        <button
          className="p-2.5 text-slate-500 hover:bg-slate-50 hover:text-brand-700"
          onClick={() => onChange(shift(month, -1))}
          aria-label="Previous month"
        >
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <span
          className="min-w-[9.5rem] px-3 text-center font-display text-base font-semibold text-slate-900"
          aria-live="polite"
        >
          {monthLabel(month)}
        </span>
        <button
          className="p-2.5 text-slate-500 hover:bg-slate-50 hover:text-brand-700 disabled:opacity-30 disabled:hover:bg-transparent"
          onClick={() => onChange(shift(month, 1))}
          disabled={atCurrent}
          aria-label="Next month"
        >
          <ChevronRightIcon width={18} height={18} />
        </button>
      </div>
      {!atCurrent && (
        <button className="btn-ghost" onClick={() => onChange(current)}>
          Back to this month
        </button>
      )}
    </div>
  )
}
