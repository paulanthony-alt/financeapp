import { useState } from 'react'
import { Card } from '../../components/ui/Card.jsx'
import { money, percent } from '../../lib/format.js'
import { clamp01 } from '../../lib/finance.js'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'

export default function IncomeCard({ income, onChange, totalBudget }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(income))

  const commit = () => {
    const n = Math.max(0, Number(draft) || 0)
    onChange(n)
    setEditing(false)
  }

  const ratio = income > 0 ? clamp01(totalBudget / income) : 0

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Monthly income</p>
          {editing ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  className="input w-40 pl-7 text-lg font-bold"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && commit()}
                />
              </div>
              <button className="btn-primary" onClick={commit}>Save</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {money(income)}
              </span>
              <button
                className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                onClick={() => {
                  setDraft(String(income))
                  setEditing(true)
                }}
              >
                Edit
              </button>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budgeted</p>
          <p className="text-lg font-bold text-slate-800">
            {money(totalBudget)}{' '}
            <span className="text-sm font-medium text-slate-400">of income</span>
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar ratio={ratio} over={totalBudget > income && income > 0} />
        <p className="mt-1.5 text-xs text-slate-500">
          {income > 0
            ? `${percent(ratio)} of income is allocated across category limits.`
            : 'Set your income to see how much of it is budgeted.'}
        </p>
      </div>
    </Card>
  )
}
