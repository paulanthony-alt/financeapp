import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { money } from '../../lib/format.js'
import { PlusIcon, EditIcon, TrashIcon, RepeatIcon } from '../../components/Icons.jsx'

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function RecurringCard({ rules, categories, onAdd, onEdit, onDelete, onToggle }) {
  const catName = (id) => categories.find((c) => c.id === id)?.name || 'Uncategorized'
  const monthlyTotal = rules.filter((r) => r.active !== false).reduce((s, r) => s + r.amount, 0)

  return (
    <Card>
      <CardHeader
        title="Recurring"
        subtitle={rules.length ? `${money(monthlyTotal)} added automatically each month` : 'Rent, subscriptions, and other fixed costs'}
        action={
          <button className="btn-ghost" onClick={onAdd}>
            <PlusIcon width={16} height={16} />
            Add
          </button>
        }
      />
      {rules.length === 0 ? (
        <EmptyState
          icon={<RepeatIcon />}
          title="Nothing recurring yet"
          message="Add costs that repeat every month and they’ll be logged for you."
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rules.map((r) => {
            const paused = r.active === false
            return (
              <li key={r.id} className={`flex items-center gap-3 py-2.5 ${paused ? 'opacity-55' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{r.description}</p>
                  <p className="text-xs text-slate-400">
                    {catName(r.categoryId)} · {ordinal(r.dayOfMonth)} of each month{paused ? ' · paused' : ''}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-slate-800">{money(r.amount)}</span>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    className="px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-brand-700"
                    onClick={() => onToggle(r.id)}
                    aria-label={paused ? `Resume ${r.description}` : `Pause ${r.description}`}
                  >
                    {paused ? 'Resume' : 'Pause'}
                  </button>
                  <button className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700" onClick={() => onEdit(r)} aria-label={`Edit ${r.description}`}>
                    <EditIcon width={15} height={15} />
                  </button>
                  <button className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(r.id)} aria-label={`Delete ${r.description}`}>
                    <TrashIcon width={15} height={15} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
