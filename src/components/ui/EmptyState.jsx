export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-50 text-gold-700 ring-1 ring-gold-200">
          {icon}
        </div>
      )}
      <h4 className="font-display text-lg font-semibold text-slate-900">{title}</h4>
      {message && <p className="mt-1 max-w-xs text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
