import { useMemo } from 'react'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { fundCosts, feeDrag, overlapWarnings, FUNDS_CHECKED } from '../../lib/funds.js'
import { money, moneyCents } from '../../lib/format.js'
import { AlertIcon } from '../../components/Icons.jsx'

const DRAG_YEARS = 25

export default function FundCostsCard({ summary, profile }) {
  const [overrides, setOverrides] = useLocalStorage('fp:invest:erOverrides', {})
  const costs = useMemo(() => fundCosts(summary.rows, overrides), [summary.rows, overrides])
  const warnings = useMemo(() => overlapWarnings(summary.rows), [summary.rows])
  const rate = profile ? profile.assumedReturn : 6.5
  const knownTotal = costs.rows.reduce((s, r) => s + (r.er != null ? r.value : 0), 0)
  const drag = costs.weightedEr != null ? feeDrag(knownTotal, rate, costs.weightedEr, DRAG_YEARS) : 0

  const setEr = (symbol, value) =>
    setOverrides((o) => {
      const next = { ...o }
      if (value === '') delete next[symbol]
      else next[symbol] = Math.max(0, Number(value) || 0)
      return next
    })

  return (
    <Card>
      <CardHeader title="Fund costs and overlap" subtitle="What your funds charge each year, where they double up, and how concentrated you are" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Mini label="Yearly fees" value={moneyCents(costs.yearly)} sub={costs.coverage < 1 ? `${Math.floor(costs.coverage * 100)}% of portfolio has a known cost` : null} />
        <Mini label="Average expense ratio" value={costs.weightedEr != null ? `${costs.weightedEr.toFixed(3)}%` : '—'} sub="weighted by value" />
        <Mini
          label={`Growth lost over ${DRAG_YEARS} yrs`}
          value={money(drag)}
          sub={`today’s balance at ${rate}%, no new money`}
        />
      </div>

      {warnings.length > 0 && (
        <ul className="mt-4 space-y-2">
          {warnings.map((w, i) => (
            <li key={i} className="flex gap-2.5 border border-gold-300 bg-gold-50 p-3 text-sm text-slate-800">
              <AlertIcon width={16} height={16} className="mt-0.5 shrink-0 text-gold-700" />
              <span>{w.text}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
              <th className="py-2 font-semibold">Fund</th>
              <th className="py-2 text-right font-semibold">Value</th>
              <th className="py-2 text-right font-semibold">Expense ratio</th>
              <th className="py-2 text-right font-semibold">Per year</th>
            </tr>
          </thead>
          <tbody>
            {costs.rows.map((r) => (
              <tr key={r.symbol} className="border-b border-slate-100 align-top">
                <td className="py-2.5">
                  <p className="font-bold text-slate-800">{r.symbol}</p>
                  {r.cheaper && (
                    <p className="text-xs text-brand-700">
                      {r.cheaper.name} ({r.cheaper.symbol}) costs {r.cheaper.er}% for similar holdings, about{' '}
                      {money((r.value * (r.er - r.cheaper.er)) / 100)}/yr less here.
                    </p>
                  )}
                </td>
                <td className="py-2.5 text-right tabular-nums text-slate-600">{money(r.value)}</td>
                <td className="py-2.5 text-right">
                  <div className="ml-auto flex w-28 items-center justify-end gap-1">
                    <input
                      className={`input w-20 px-2 py-1 text-right text-sm ${r.er == null ? 'border-gold-400' : ''}`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="?"
                      aria-label={`Expense ratio for ${r.symbol}`}
                      value={overrides[r.symbol] ?? (r.er ?? '')}
                      onChange={(e) => setEr(r.symbol, e.target.value)}
                    />
                    <span className="text-slate-500">%</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {r.source === 'you'
                      ? 'entered by you'
                      : r.source === 'table'
                        ? 'reference table'
                        : r.source === 'stock'
                          ? 'individual stock, no fund fee'
                          : 'enter from fund page'}
                  </p>
                </td>
                <td className="py-2.5 text-right tabular-nums text-slate-800">{r.cost != null ? moneyCents(r.cost) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Expense ratios come from FinPilot’s reference table (compiled {FUNDS_CHECKED}) and change over time, so
        confirm them on each fund’s page and edit any that differ. If a cheaper fund appeals, consider directing
        new money to it; selling in a taxable account can trigger capital-gains tax.
      </p>
    </Card>
  )
}

function Mini({ label, value, sub }) {
  return (
    <div className="border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}
