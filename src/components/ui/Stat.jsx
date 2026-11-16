// A compact KPI tile.
export function Stat({ label, value, sub, accent = 'slate', icon }) {
  const accents = {
    slate: 'text-slate-900',
    brand: 'text-brand-800',
    green: 'text-brand-600',
    red: 'text-red-700',
    amber: 'text-gold-700',
  }
  const bars = {
    slate: 'bg-slate-300',
    brand: 'bg-brand-700',
    green: 'bg-brand-500',
    red: 'bg-red-600',
    amber: 'bg-gold-500',
  }
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <span className={`h-3 w-1 rounded-full ${bars[accent] || bars.slate}`} aria-hidden="true" />
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-2.5 font-display text-[1.75rem] font-semibold leading-none tabular-nums ${accents[accent] || accents.slate}`}>
        {value}
      </div>
      {sub && <div className="mt-2 text-sm text-slate-500">{sub}</div>}
    </div>
  )
}
