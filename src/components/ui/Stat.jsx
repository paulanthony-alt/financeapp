// A compact KPI tile — styled like a stamped banknote.
export function Stat({ label, value, sub, accent = 'slate', icon }) {
  const accents = {
    slate: 'text-slate-800',
    brand: 'text-brand-700',
    green: 'text-brand-600',
    red: 'text-red-700',
    amber: 'text-gold-700',
  }
  const stripe = {
    slate: 'bg-slate-300',
    brand: 'bg-brand-600',
    green: 'bg-brand-400',
    red: 'bg-red-600',
    amber: 'bg-gold-500',
  }
  return (
    <div className="card overflow-hidden pl-6">
      <span
        className={`absolute inset-y-0 left-0 w-2.5 border-r-2 border-ink ${stripe[accent] || stripe.slate}`}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -right-3 -top-4 select-none font-serif text-7xl font-bold text-brand-700/[0.07]"
        aria-hidden="true"
      >
        $
      </span>
      <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-2 font-display text-3xl tracking-wide tabular-nums ${accents[accent] || accents.slate}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-sm font-semibold text-slate-500">{sub}</div>}
    </div>
  )
}
