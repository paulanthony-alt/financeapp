import { useState } from 'react'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { money, percent, prettyDate } from '../../lib/format.js'
import { requiredMonthly, monthsBetween, clamp01 } from '../../lib/finance.js'
import { EditIcon, TrashIcon, PlusIcon, CheckIcon, TargetIcon } from '../../components/Icons.jsx'

const QUICK_ADDS = [25, 50, 100, 250]

export default function GoalCard({ goal, onEdit, onDelete, onContribute }) {
  const [custom, setCustom] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const saved = Math.min(goal.saved, goal.target)
  const ratio = goal.target > 0 ? clamp01(goal.saved / goal.target) : 0
  const complete = goal.saved >= goal.target && goal.target > 0
  const remaining = Math.max(0, goal.target - goal.saved)
  const monthly = requiredMonthly(goal.target, goal.saved, goal.targetDate)
  const months = monthsBetween(new Date(), goal.targetDate)
  const overdue = months <= 0 && !complete

  const addCustom = () => {
    const n = Number(custom)
    if (n) {
      onContribute(Math.round(n * 100) / 100)
      setCustom('')
    }
  }

  return (
    <div className="card flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              complete ? 'bg-emerald-100 text-emerald-600' : 'bg-brand-100 text-brand-600'
            }`}
          >
            {complete ? <CheckIcon /> : <TargetIcon />}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-slate-800">{goal.name}</h3>
            <p className="text-xs text-slate-400">
              Target {prettyDate(goal.targetDate)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
            onClick={onEdit}
            aria-label="Edit goal"
          >
            <EditIcon width={16} height={16} />
          </button>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete goal"
          >
            <TrashIcon width={16} height={16} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-end justify-between">
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            {money(saved)}
          </span>
          <span className="text-sm text-slate-400">of {money(goal.target)}</span>
        </div>
        <ProgressBar ratio={ratio} />
        <div className="mt-1.5 flex justify-between text-xs">
          <span className="font-semibold text-slate-500">{percent(ratio)}</span>
          <span className="text-slate-400">{money(remaining)} to go</span>
        </div>
      </div>

      {/* Status line */}
      <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
        {complete ? (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <CheckIcon width={16} height={16} /> Goal reached — nice work!
          </p>
        ) : overdue ? (
          <p className="text-sm text-red-600">
            <span className="font-semibold">Past due.</span> {money(remaining)} still needed.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            Save{' '}
            <span className="font-bold text-slate-800">{money(monthly)}/mo</span>{' '}
            to hit this in {months} {months === 1 ? 'month' : 'months'}.
          </p>
        )}
      </div>

      {/* Contribution controls */}
      {!complete && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ADDS.map((amt) => (
              <button
                key={amt}
                onClick={() => onContribute(amt)}
                className="chip border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600"
              >
                +${amt}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                className="input pl-6 py-1.5 text-sm"
                type="number"
                min="0"
                placeholder="Custom amount"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              />
            </div>
            <button className="btn-primary px-3 py-1.5" onClick={addCustom} disabled={!Number(custom)}>
              <PlusIcon width={16} height={16} />
              Add
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">Delete “{goal.name}”?</p>
          <div className="mt-2 flex gap-2">
            <button className="btn-danger px-3 py-1.5" onClick={onDelete}>
              Delete
            </button>
            <button className="btn-ghost px-3 py-1.5" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
