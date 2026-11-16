import { useEffect, useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { Stat } from '../../components/ui/Stat.jsx'
import { money, uid, todayISO, prettyDate } from '../../lib/format.js'
import { computeNetWorth, upsertSnapshot } from '../../lib/history.js'
import { PlusIcon, TrashIcon } from '../../components/Icons.jsx'

export default function NetWorthSection() {
  const [items, setItems] = useLocalStorage('fp:networth:items', [])
  const [history, setHistory] = useLocalStorage('fp:networth:history', [])
  const [includeInvested, setIncludeInvested] = useLocalStorage('fp:networth:includeInvested', true)
  // Imported Fidelity positions (read-only here; managed in the Investing tab).
  const [portfolio] = useLocalStorage('fp:invest:portfolio', null)

  const investedValue = useMemo(
    () => (portfolio ? portfolio.holdings.reduce((s, h) => s + h.value, 0) : 0),
    [portfolio],
  )
  const invested = includeInvested ? investedValue : 0
  const totals = useMemo(() => computeNetWorth(items, invested), [items, invested])
  const hasData = items.length > 0 || invested > 0

  // Keep today's snapshot current so the chart fills in as you use the app.
  useEffect(() => {
    if (!hasData) return
    const snap = {
      date: todayISO(),
      assets: Math.round(totals.assets * 100) / 100,
      debts: Math.round(totals.debts * 100) / 100,
      net: Math.round(totals.net * 100) / 100,
    }
    setHistory((h) => {
      const cur = h.find((s) => s.date === snap.date)
      if (cur && cur.net === snap.net && cur.assets === snap.assets && cur.debts === snap.debts) return h
      return upsertSnapshot(h, snap)
    })
  }, [hasData, totals, setHistory])

  const add = (kind, name, value) =>
    setItems((prev) => [...prev, { id: uid(), kind, name, value }])
  const update = (id, patch) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id))

  const assets = items.filter((i) => i.kind !== 'debt')
  const debts = items.filter((i) => i.kind === 'debt')

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="col-span-2 lg:col-span-1">
          <Stat label="Net worth" value={money(totals.net)} accent={totals.net < 0 ? 'red' : 'brand'} sub="Assets minus debts" />
        </div>
        <Stat label="Assets" value={money(totals.assets)} accent="green" />
        <Stat label="Debts" value={money(totals.debts)} accent={totals.debts > 0 ? 'amber' : 'slate'} />
      </div>

      <Card>
        <CardHeader
          title="Over time"
          subtitle={history.length > 1 ? `${history.length} snapshots, saved automatically` : 'Your net worth is saved as you update it'}
        />
        {history.length < 2 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Come back after your numbers change. The chart starts with your second snapshot.
          </p>
        ) : (
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#157f49" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#157f49" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7dfcf" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#746c5e' }} tickFormatter={(d) => prettyDate(d).replace(/, \d{4}$/, '')} />
                <YAxis tick={{ fontSize: 11, fill: '#746c5e' }} tickFormatter={(v) => (Math.abs(v) >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)} domain={['auto', 'auto']} />
                <Tooltip formatter={(v) => money(v)} labelFormatter={prettyDate} />
                <Area type="monotone" dataKey="net" name="Net worth" stroke="#157f49" strokeWidth={2.5} fill="url(#gNet)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Assets" subtitle="What you own" />
          {investedValue > 0 && (
            <label className="mb-3 flex items-start gap-2 bg-brand-50 p-3 text-sm text-brand-800 ring-1 ring-brand-100">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-brand-600"
                checked={includeInvested}
                onChange={(e) => setIncludeInvested(e.target.checked)}
              />
              <span>
                Include my imported Fidelity portfolio <strong>({money(investedValue)})</strong>
              </span>
            </label>
          )}
          <ItemList items={assets} kind="asset" placeholder="e.g. Checking account" onAdd={add} onUpdate={update} onRemove={remove} />
        </Card>
        <Card>
          <CardHeader title="Debts" subtitle="What you owe" />
          <ItemList items={debts} kind="debt" placeholder="e.g. Car loan" onAdd={add} onUpdate={update} onRemove={remove} />
        </Card>
      </div>
    </div>
  )
}

function ItemList({ items, kind, placeholder, onAdd, onUpdate, onRemove }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const v = Number(value)
    if (!name.trim() || !(v >= 0) || value === '') return
    onAdd(kind, name.trim(), Math.round(v * 100) / 100)
    setName('')
    setValue('')
  }

  return (
    <>
      {items.length > 0 && (
        <ul className="mb-4 divide-y divide-slate-100">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{i.name}</span>
              <div className="relative w-32 shrink-0">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  className="input py-1.5 pl-6 text-right text-sm"
                  type="number"
                  min="0"
                  aria-label={`${i.name} value`}
                  value={i.value === 0 ? '' : i.value}
                  onChange={(e) => onUpdate(i.id, { value: Math.max(0, Number(e.target.value) || 0) })}
                />
              </div>
              <button className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => onRemove(i.id)} aria-label={`Delete ${i.name}`}>
                <TrashIcon width={15} height={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          className="input min-w-[8rem] flex-1"
          placeholder={placeholder}
          aria-label={kind === 'debt' ? 'Debt name' : 'Asset name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="relative w-28">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
          <input
            className="input pl-6"
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            aria-label={kind === 'debt' ? 'Debt amount' : 'Asset value'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={!name.trim() || value === ''}>
          <PlusIcon width={16} height={16} />
          Add
        </button>
      </form>
    </>
  )
}
