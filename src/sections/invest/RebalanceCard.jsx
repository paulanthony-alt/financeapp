import { useMemo } from 'react'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { rebalanceWithContribution, lookThroughMixed, suggestedFunds } from '../../lib/rebalance.js'
import { ALLOCATION_COLORS } from '../../lib/constants.js'
import { money } from '../../lib/format.js'

export default function RebalanceCard({ summary, profile }) {
  const [opts, setOpts] = useLocalStorage('fp:invest:rebalance', { contribution: 500, mixedStockPct: 60 })
  const mixed = summary.byClass.Mixed || 0

  const current = useMemo(
    () => lookThroughMixed(summary.byClass, opts.mixedStockPct),
    [summary.byClass, opts.mixedStockPct],
  )
  const plan = useMemo(
    () => (profile ? rebalanceWithContribution(current, profile.allocation, opts.contribution) : null),
    [current, profile, opts.contribution],
  )
  const funds = useMemo(() => suggestedFunds(summary.rows), [summary.rows])
  const total = Object.values(current).reduce((a, b) => a + b, 0)

  const set = (k) => (e) => setOpts((o) => ({ ...o, [k]: Math.max(0, Number(e.target.value) || 0) }))

  return (
    <Card>
      <CardHeader
        title="Rebalance with new money"
        subtitle="Where to put your next contribution to move back toward your target, without selling anything"
      />

      {!profile ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Pick a risk profile below (or answer the questionnaire) to set your target mix.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="label" htmlFor="rb-amount">I’m about to invest</label>
              <div className="relative w-40">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input id="rb-amount" className="input pl-7" type="number" min="0" step="50" value={opts.contribution} onChange={set('contribution')} />
              </div>
            </div>
            {mixed > 0 && (
              <div>
                <label className="label" htmlFor="rb-mixed">My target-date / balanced funds are about</label>
                <div className="flex items-center gap-2">
                  <input id="rb-mixed" className="input w-20" type="number" min="0" max="100" value={opts.mixedStockPct} onChange={set('mixedStockPct')} />
                  <span className="text-sm text-slate-600">% stocks</span>
                </div>
              </div>
            )}
          </div>
          {mixed > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              {money(mixed)} is in multi-asset funds. Check the stock/bond split on the fund’s fact sheet; it’s
              counted toward stocks and bonds using the percentage above.
            </p>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-[0.12em] text-slate-500">
                  <th className="py-2 font-semibold">Asset class</th>
                  <th className="py-2 text-right font-semibold">Now</th>
                  <th className="py-2 text-right font-semibold">Target</th>
                  <th className="py-2 text-right font-semibold">Buy</th>
                  <th className="py-2 text-right font-semibold">After</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(profile.allocation).map((cls) => {
                  const nowPct = total > 0 ? (current[cls] / total) * 100 : 0
                  const buy = plan.buys[cls] || 0
                  return (
                    <tr key={cls} className="border-b border-slate-100 align-top">
                      <td className="py-2.5">
                        <span className="flex items-center gap-2 font-semibold text-slate-800">
                          <span className="h-2.5 w-2.5" style={{ backgroundColor: ALLOCATION_COLORS[cls] }} />
                          {cls}
                        </span>
                        {buy > 0 && funds[cls] && (
                          <span className="ml-[18px] text-xs text-slate-400">e.g. add to {funds[cls].symbol}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-slate-600">{nowPct.toFixed(1)}%</td>
                      <td className="py-2.5 text-right tabular-nums text-slate-600">{profile.allocation[cls]}%</td>
                      <td className={`py-2.5 text-right font-bold tabular-nums ${buy > 0 ? 'text-brand-700' : 'text-slate-300'}`}>
                        {buy > 0 ? money(buy) : '—'}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-slate-800">{plan.afterPct[cls].toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            {plan.needed < 1
              ? `You’re on target, so this splits your money by your ${profile.label.toLowerCase()} mix.`
              : opts.contribution >= plan.needed
                ? `This brings you fully back to target (it takes ${money(plan.needed)}); the rest is split by your target mix.`
                : `Getting fully back to target would take ${money(plan.needed)} of new money. This contribution moves you as close as it can.`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Buying instead of selling avoids realizing gains in taxable accounts. Target: {profile.label} profile.
          </p>
        </>
      )}
    </Card>
  )
}
