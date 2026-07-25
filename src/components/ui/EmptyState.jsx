export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      {message && <p className="mt-1 max-w-xs text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
