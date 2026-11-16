import { useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { Card } from '../../components/ui/Card.jsx'
import { Stat } from '../../components/ui/Stat.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { uid, todayISO, prettyDate } from '../../lib/format.js'
import {
  STAGES,
  ALL_STAGES,
  stageIndex,
  stageInfo,
  isClose,
  newCompany,
  setStage,
  sortWatchlist,
  researchLinks,
  DEFAULT_WATCHLIST,
} from '../../lib/ipo.js'
import { PlusIcon, TrashIcon, BellIcon, ExternalIcon } from '../../components/Icons.jsx'

export default function IpoSection() {
  const [list, setList] = useLocalStorage('fp:ipo:watchlist', () => DEFAULT_WATCHLIST(todayISO()))
  const sorted = sortWatchlist(list)
  const close = list.filter(isClose).length
  const live = list.filter((c) => c.stage === 'trading').length

  const update = (id, fn) => setList((prev) => prev.map((c) => (c.id === id ? fn(c) : c)))
  const remove = (id) => setList((prev) => prev.filter((c) => c.id !== id))
  const add = (fields) => setList((prev) => [...prev, newCompany(fields, uid(), todayISO())])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Watching" value={list.length} accent="brand" icon={<BellIcon width={14} height={14} />} />
        <Stat label="Filed / close" value={close} accent={close > 0 ? 'amber' : 'slate'} sub="Prospectus public, not yet trading" />
        <div className="col-span-2 lg:col-span-1">
          <Stat label="Now trading" value={live} accent={live > 0 ? 'green' : 'slate'} />
        </div>
      </div>

      <div className="flex items-start gap-3 border border-brand-200 bg-brand-50 p-4 text-sm text-slate-700">
        <BellIcon width={18} height={18} className="mt-0.5 shrink-0 text-brand-700" />
        <p>
          A scheduled check looks for IPO news and SEC filings for your list each weekday and notifies you when
          something moves. Update a company’s stage here when it does. The app doesn’t fetch live data itself, so
          use the links on each company to confirm.
        </p>
      </div>

      <AddCompany existing={list} onAdd={add} />

      {sorted.length === 0 ? (
        <div className="card">
          <EmptyState icon={<BellIcon />} title="No companies yet" message="Add a private company you’d like to know about when it goes public." />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {sorted.map((c) => (
            <CompanyCard
              key={c.id}
              company={c}
              onStage={(stage) => update(c.id, (x) => setStage(x, stage, todayISO()))}
              onChange={(patch) => update(c.id, (x) => ({ ...x, ...patch }))}
              onRemove={() => remove(c.id)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">
        IPO shares often swing sharply in their first months of trading. For long-term investing, many people wait
        for the price to settle and earnings reports to come out before buying. Not financial advice.
      </p>
    </div>
  )
}

function AddCompany({ existing, onAdd }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    if (existing.some((c) => c.name.toLowerCase() === n.toLowerCase())) {
      setError(`${n} is already on your list.`)
      return
    }
    onAdd({ name: n })
    setName('')
    setError('')
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <label className="label" htmlFor="ipo-name">Add a company to watch</label>
          <input
            id="ipo-name"
            className="input"
            placeholder="e.g. Stripe, Databricks, SpaceX"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={!name.trim()}>
          <PlusIcon width={16} height={16} />
          Watch
        </button>
      </form>
      {error && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{error}</p>}
    </Card>
  )
}

function CompanyCard({ company: c, onStage, onChange, onRemove }) {
  const [confirm, setConfirm] = useState(false)
  const idx = stageIndex(c.stage)
  const info = stageInfo(c.stage)
  const withdrawn = c.stage === 'withdrawn'
  const tone = withdrawn ? 'text-slate-500' : c.stage === 'trading' ? 'text-brand-700' : isClose(c) ? 'text-gold-700' : 'text-slate-700'

  return (
    <div className={`card flex flex-col ${isClose(c) ? 'ring-1 ring-gold-400' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-semibold text-slate-900">
            {c.name}
            {c.ticker && <span className="ml-2 font-sans text-sm font-semibold text-slate-400">{c.ticker}</span>}
          </h3>
          <p className={`text-sm font-semibold ${tone}`}>{info.label}</p>
        </div>
        <button className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setConfirm(true)} aria-label={`Stop watching ${c.name}`}>
          <TrashIcon width={16} height={16} />
        </button>
      </div>

      {/* Progress along the path to listing */}
      <ol className="mt-4 grid grid-cols-7 gap-1" aria-label={`${c.name} IPO progress: ${info.label}`}>
        {STAGES.map((s, i) => (
          <li
            key={s.id}
            title={s.label}
            className={`h-1.5 ${withdrawn ? 'bg-slate-200' : i <= idx ? (c.stage === 'trading' ? 'bg-brand-600' : 'bg-gold-500') : 'bg-slate-200'}`}
          />
        ))}
      </ol>
      <p className="mt-2 text-xs text-slate-500">{info.help}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor={`stage-${c.id}`}>Stage</label>
          <select id={`stage-${c.id}`} className="input" value={c.stage} onChange={(e) => onStage(e.target.value)}>
            {ALL_STAGES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor={`date-${c.id}`}>{c.stage === 'trading' ? 'Listed on' : 'Expected date'}</label>
          <input id={`date-${c.id}`} className="input" type="date" value={c.expectedDate} onChange={(e) => onChange({ expectedDate: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor={`ticker-${c.id}`}>Ticker</label>
          <input
            id={`ticker-${c.id}`}
            className="input uppercase"
            placeholder="once known"
            value={c.ticker}
            onChange={(e) => onChange({ ticker: e.target.value.toUpperCase().replace(/[^A-Z0-9.]/g, '').slice(0, 8) })}
          />
        </div>
        <div>
          <label className="label" htmlFor={`notes-${c.id}`}>Notes</label>
          <input id={`notes-${c.id}`} className="input" placeholder="e.g. exchange, range" value={c.notes} onChange={(e) => onChange({ notes: e.target.value })} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div className="flex flex-wrap gap-3">
          {researchLinks(c).map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">
              {l.label}
              <ExternalIcon width={13} height={13} />
            </a>
          ))}
        </div>
        <span className="text-xs text-slate-400">Updated {prettyDate(c.updatedAt)}</span>
      </div>

      {c.history?.length > 1 && (
        <details className="mt-2 text-xs text-slate-500">
          <summary className="cursor-pointer">History</summary>
          <ul className="mt-1 space-y-0.5">
            {[...c.history].reverse().map((h, i) => (
              <li key={i}>{prettyDate(h.date)}: {stageInfo(h.stage).label}</li>
            ))}
          </ul>
        </details>
      )}

      {confirm && (
        <div className="mt-3 border border-red-200 bg-red-50 p-3" role="alert">
          <p className="text-sm font-medium text-red-700">Stop watching {c.name}?</p>
          <div className="mt-2 flex gap-2">
            <button className="btn-danger px-3 py-1.5" onClick={onRemove}>Remove</button>
            <button className="btn-ghost px-3 py-1.5" onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
