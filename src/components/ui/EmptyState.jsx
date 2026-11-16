export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      {icon && (
        <div className="coin mb-4 h-14 w-14 text-ink">
          {icon}
        </div>
      )}
      <h4 className="font-display text-xl tracking-wide text-brand-800">{title}</h4>
      {message && <p className="mt-1 max-w-xs font-serif text-sm italic text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
