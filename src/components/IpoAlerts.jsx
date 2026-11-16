import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { BellIcon, ExternalIcon } from './Icons.jsx'

/** Alerts raised by the nightly IPO check, shown on every tab until dismissed. */
export default function IpoAlerts({ onOpen }) {
  const [alerts, setAlerts] = useLocalStorage('fp:ipo:alerts', [])
  const unseen = alerts.filter((a) => !a.seen)
  if (!unseen.length) return null
  const dismiss = (id) => setAlerts((all) => all.map((a) => (a.id === id ? { ...a, seen: true } : a)))

  return (
    <div className="mb-6 space-y-2" role="status">
      {unseen.map((a) => (
        <div key={a.id} className="flex flex-wrap items-center gap-3 border border-gold-400 bg-gold-50 px-4 py-3 shadow-card">
          <BellIcon width={18} height={18} className="shrink-0 text-gold-700" />
          <p className="min-w-0 flex-1 text-sm font-semibold text-slate-900">{a.text}</p>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            {a.url && (
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-900">
                Filing <ExternalIcon width={13} height={13} />
              </a>
            )}
            <button className="font-semibold text-brand-700 hover:text-brand-900" onClick={() => onOpen()}>IPO watch</button>
            <button className="text-slate-500 hover:text-slate-800" onClick={() => dismiss(a.id)} aria-label={`Dismiss: ${a.text}`}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  )
}
