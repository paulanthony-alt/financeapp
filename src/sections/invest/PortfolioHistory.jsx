import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { historyChange } from '../../lib/history.js'
import { money, percent, prettyDate } from '../../lib/format.js'
import { ChartIcon } from '../../components/Icons.jsx'

export default function PortfolioHistory({ history, onClear }) {
  const change = historyChange(history)
  const last = history[history.length - 1]
  const hasBasis = history.length > 0 && history.every((s) => s.costBasis != null)

  return (
    <Card>
      <CardHeader
        title="Portfolio history"
        subtitle={
          change
            ? `${change.change >= 0 ? '+' : '−'}${money(Math.abs(change.change))} (${percent(change.pct)}) since ${prettyDate(change.from)}`
            : 'A snapshot is saved each time you import your positions'
        }
        action={
          history.length > 0 && (
            <button className="btn-ghost" onClick={onClear}>Clear history</button>
          )
        }
      />
      {history.length === 0 ? (
        <EmptyState
          icon={<ChartIcon />}
          title="No history yet"
          message="Import your Fidelity positions to save the first snapshot. Import again every few weeks to see how your portfolio grows."
        />
      ) : history.length === 1 ? (
        <div className="py-6 text-center">
          <p className="font-display text-3xl font-semibold text-slate-900">{money(last.total)}</p>
          <p className="mt-1 text-sm text-slate-500">on {prettyDate(last.date)}</p>
          <p className="mt-3 text-sm text-slate-500">Import again later to start the chart.</p>
        </div>
      ) : (
        <>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gHist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#157f49" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#157f49" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7dfcf" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#746c5e' }} tickFormatter={(d) => prettyDate(d).replace(/, \d{4}$/, '')} />
                <YAxis tick={{ fontSize: 11, fill: '#746c5e' }} tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)} domain={['auto', 'auto']} />
                <Tooltip formatter={(v, name) => [money(v), name]} labelFormatter={prettyDate} />
                {hasBasis && <Legend wrapperStyle={{ fontSize: 12 }} />}
                {hasBasis && (
                  <Area type="monotone" dataKey="costBasis" name="Paid in (cost basis)" stroke="#a39a88" strokeWidth={2} fill="none" isAnimationActive={false} />
                )}
                <Area type="monotone" dataKey="total" name="Value" stroke="#157f49" strokeWidth={2.5} fill="url(#gHist)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {hasBasis && (
            <p className="mt-2 text-xs text-slate-500">
              Gain on cost: {money(last.total - last.costBasis)} ({percent(last.costBasis > 0 ? (last.total - last.costBasis) / last.costBasis : 0)}).
              Cost basis is what you paid in, as reported by Fidelity.
            </p>
          )}
        </>
      )}
    </Card>
  )
}
