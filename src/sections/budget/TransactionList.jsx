import { useMemo, useState } from 'react'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { money, prettyDate } from '../../lib/format.js'
import { PALETTE } from '../../lib/constants.js'
import { PlusIcon, TrashIcon, EditIcon, WalletIcon } from '../../components/Icons.jsx'

export default function TransactionList({ transactions, categories, onAdd, onEdit, onDelete }) {
  const [filter, setFilter] = useState('all')

  const catById = useMemo(() => {
    const m = {}
    categories.forEach((c, i) => {
      m[c.id] = { ...c, color: PALETTE[i % PALETTE.length] }
    })
    return m
  }, [categories])

  const sorted = useMemo(() => {
    const list = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1))
    return filter === 'all' ? list : list.filter((t) => t.categoryId === filter)
  }, [transactions, filter])

  return (
    <Card>
      <CardHeader
        title="Transactions"
        subtitle={`${transactions.length} logged`}
        action={
          <button className="btn-primary" onClick={onAdd}>
            <PlusIcon width={16} height={16} />
            Add
          </button>
        }
      />

      {categories.length > 0 && transactions.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterChip>
          {categories.map((c) => (
            <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.name}
            </FilterChip>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title={transactions.length === 0 ? 'No transactions yet' : 'Nothing in this category'}
          message={
            transactions.length === 0
              ? 'Add your first expense to start tracking spending.'
              : 'Try a different filter or add a transaction here.'
          }
          action={
            <button className="btn-primary" onClick={onAdd}>
              <PlusIcon width={16} height={16} />
              Add transaction
            </button>
          }
        />
      ) : (
        <ul className="divide-y divide-slate-100">
          {sorted.map((t) => {
            const cat = catById[t.categoryId]
            return (
              <li key={t.id} className="group flex items-center gap-3 py-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: cat?.color || '#94a3b8' }}
                >
                  <WalletIcon width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {t.description || cat?.name || 'Expense'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {cat?.name || 'Uncategorized'} · {prettyDate(t.date)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-slate-800">
                  {money(t.amount)}
                </span>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                    onClick={() => onEdit(t)}
                    aria-label="Edit transaction"
                  >
                    <EditIcon width={16} height={16} />
                  </button>
                  <button
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => onDelete(t.id)}
                    aria-label="Delete transaction"
                  >
                    <TrashIcon width={16} height={16} />
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

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`chip border transition ${
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}
