export function Card({ className = '', children }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display text-xl tracking-wide text-brand-800">{title}</h3>
        {subtitle && <p className="mt-0.5 break-words text-sm font-semibold text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
