import { useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { money } from '../../lib/format.js'
import { requiredMonthly } from '../../lib/finance.js'
import { TargetIcon } from '../../components/Icons.jsx'

/** Shows what goals need each month and lets leftover budget be moved into one. */
export default function GoalsBudgetCard({ goals, income, spent, onContribute }) {
  const active = goals.filter((g) => g.saved < g.target)
  const needed = active.reduce((s, g) => s + requiredMonthly(g.target, g.saved, g.targetDate), 0)
  const afterSpending = income - spent
  const afterGoals = afterSpending - needed
  const [goalId, setGoalId] = useState('')
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState('')

  const selected = active.find((g) => g.id === goalId) || active[0]
  const suggested = Math.max(0, Math.floor(afterSpending))
  const value = amount === '' ? suggested : Number(amount)

  const move = () => {
    if (!selected || !(value > 0)) return
    onContribute(selected.id, Math.round(value * 100) / 100)
    setDone(`Moved ${money(value)} to ${selected.name}.`)
    setAmount('')
  }

  return (
    <Card>
      <CardHeader title="Goals" subtitle="Monthly savings your goals need, from this month’s budget" />
      {active.length === 0 ? (
        <p className="flex items-center gap-2 py-4 text-sm text-slate-500">
          <TargetIcon width={16} height={16} /> No open goals. Create one in the Goals tab.
        </p>
      ) : (
        <>
          <dl className="space-y-1.5 text-sm">
            <Row label="Income" value={money(income)} />
            <Row label="Spent this month" value={`− ${money(spent)}`} />
            <Row label={`Needed for ${active.length} ${active.length === 1 ? 'goal' : 'goals'}`} value={`− ${money(needed)}`} />
            <div className="border-t border-slate-200 pt-1.5">
              <Row label="Left after goals" value={money(afterGoals)} strong tone={afterGoals < 0 ? 'text-red-700' : 'text-brand-700'} />
            </div>
          </dl>
          {afterGoals < 0 && (
            <p className="mt-3 bg-gold-50 p-2.5 text-xs text-gold-800 ring-1 ring-gold-200">
              Your goals need {money(-afterGoals)} more per month than this budget leaves.
            </p>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="label">Move money to a goal</p>
            <div className="flex flex-wrap gap-2">
              <select className="input w-auto min-w-[8rem] flex-1" value={selected?.id || ''} onChange={(e) => setGoalId(e.target.value)} aria-label="Goal">
                {active.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <div className="relative w-28">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  className="input pl-6"
                  type="number"
                  min="0"
                  aria-label="Amount to move"
                  value={amount === '' ? suggested || '' : amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setDone('')
                  }}
                />
              </div>
              <button className="btn-primary" onClick={move} disabled={!(value > 0)}>Move</button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">Prefilled with what’s left after spending. Adds to the goal’s saved amount.</p>
            {done && <p className="mt-2 text-sm font-medium text-brand-700" role="status">{done}</p>}
          </div>
        </>
      )}
    </Card>
  )
}

function Row({ label, value, strong = false, tone = 'text-slate-800' }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular-nums ${strong ? 'font-bold' : 'font-semibold'} ${tone}`}>{value}</dd>
    </div>
  )
}
