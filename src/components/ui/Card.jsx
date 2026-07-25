export function Card({ className = '', children }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
