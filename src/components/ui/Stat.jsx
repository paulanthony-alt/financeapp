// A compact KPI tile.
export function Stat({ label, value, sub, accent = 'slate', icon }) {
  const accents = {
    slate: 'text-slate-800',
    brand: 'text-brand-600',
    green: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  }
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-2 text-2xl font-extrabold tabular-nums ${accents[accent] || accents.slate}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-sm text-slate-500">{sub}</div>}
    </div>
  )
}
