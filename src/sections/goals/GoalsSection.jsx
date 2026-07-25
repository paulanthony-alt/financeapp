import { useMemo, useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { uid, money } from '../../lib/format.js'
import { requiredMonthly } from '../../lib/finance.js'
import { Stat } from '../../components/ui/Stat.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { TargetIcon, PlusIcon } from '../../components/Icons.jsx'
import GoalCard from './GoalCard.jsx'
import GoalModal from './GoalModal.jsx'

const seedGoals = () => [
  {
    id: uid(),
    name: 'Emergency fund',
    target: 6000,
    saved: 2200,
    targetDate: nextYearISO(6),
    createdAt: new Date().toISOString(),
  },
]

function nextYearISO(monthsAhead) {
  const d = new Date()
  d.setMonth(d.getMonth() + monthsAhead)
  return d.toISOString().slice(0, 10)
}

export default function GoalsSection() {
  const [goals, setGoals] = useLocalStorage('fp:goals', seedGoals)
  const [modal, setModal] = useState({ open: false, editing: null })

  const totals = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.target, 0)
    const saved = goals.reduce((s, g) => s + Math.min(g.saved, g.target), 0)
    const monthly = goals.reduce(
      (s, g) => s + requiredMonthly(g.target, g.saved, g.targetDate),
      0,
    )
    return { target, saved, monthly }
  }, [goals])

  const saveGoal = (data) => {
    if (data.id) {
      setGoals((prev) => prev.map((g) => (g.id === data.id ? { ...g, ...data } : g)))
    } else {
      setGoals((prev) => [
        ...prev,
        { ...data, id: uid(), createdAt: new Date().toISOString() },
      ])
    }
    setModal({ open: false, editing: null })
  }

  const deleteGoal = (id) => setGoals((prev) => prev.filter((g) => g.id !== id))

  const addContribution = (id, amount) =>
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved + amount) } : g)),
    )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Active goals"
          value={goals.length}
          accent="brand"
          icon={<TargetIcon width={14} height={14} />}
        />
        <Stat label="Saved so far" value={money(totals.saved)} accent="green" />
        <Stat label="Total targets" value={money(totals.target)} accent="slate" />
        <Stat
          label="Needed / month"
          value={money(totals.monthly)}
          accent="amber"
          sub="To stay on track"
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Your goals</h2>
        <button className="btn-primary" onClick={() => setModal({ open: true, editing: null })}>
          <PlusIcon width={16} height={16} />
          New goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<TargetIcon />}
            title="No goals yet"
            message="Create a savings goal with a target amount and date to start tracking progress."
            action={
              <button className="btn-primary" onClick={() => setModal({ open: true, editing: null })}>
                <PlusIcon width={16} height={16} />
                Create a goal
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => setModal({ open: true, editing: g })}
              onDelete={() => deleteGoal(g.id)}
              onContribute={(amt) => addContribution(g.id, amt)}
            />
          ))}
        </div>
      )}

      <GoalModal
        open={modal.open}
        editing={modal.editing}
        onClose={() => setModal({ open: false, editing: null })}
        onSave={saveGoal}
      />
    </div>
  )
}
