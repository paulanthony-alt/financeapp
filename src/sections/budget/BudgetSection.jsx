import { useMemo, useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { DEFAULT_CATEGORIES } from '../../lib/constants.js'
import { uid, money, todayISO } from '../../lib/format.js'
import { Stat } from '../../components/ui/Stat.jsx'
import { WalletIcon, PlusIcon, AlertIcon } from '../../components/Icons.jsx'
import IncomeCard from './IncomeCard.jsx'
import CategoryBudgets from './CategoryBudgets.jsx'
import SpendingChart from './SpendingChart.jsx'
import TransactionList from './TransactionList.jsx'
import TransactionModal from './TransactionModal.jsx'
import CategoryModal from './CategoryModal.jsx'

const seedCategories = () =>
  DEFAULT_CATEGORIES.map((c) => ({ id: uid(), name: c.name, limit: c.limit }))

export default function BudgetSection() {
  const [income, setIncome] = useLocalStorage('fp:budget:income', 4200)
  const [categories, setCategories] = useLocalStorage('fp:budget:categories', seedCategories)
  const [transactions, setTransactions] = useLocalStorage('fp:budget:transactions', [])

  const [txModal, setTxModal] = useState({ open: false, editing: null })
  const [catModalOpen, setCatModalOpen] = useState(false)

  // --- Derived aggregates -------------------------------------------------
  const spentByCategory = useMemo(() => {
    const map = {}
    for (const c of categories) map[c.id] = 0
    for (const t of transactions) {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount
    }
    return map
  }, [categories, transactions])

  const totalSpent = useMemo(
    () => transactions.reduce((s, t) => s + t.amount, 0),
    [transactions],
  )
  const totalBudget = useMemo(
    () => categories.reduce((s, c) => s + (c.limit || 0), 0),
    [categories],
  )
  const remaining = income - totalSpent
  const overBudgetCats = categories.filter(
    (c) => c.limit > 0 && (spentByCategory[c.id] || 0) > c.limit,
  )

  // --- Transaction CRUD ---------------------------------------------------
  const saveTransaction = (data) => {
    if (data.id) {
      setTransactions((prev) => prev.map((t) => (t.id === data.id ? { ...t, ...data } : t)))
    } else {
      setTransactions((prev) => [{ ...data, id: uid() }, ...prev])
    }
    setTxModal({ open: false, editing: null })
  }
  const deleteTransaction = (id) =>
    setTransactions((prev) => prev.filter((t) => t.id !== id))

  // --- Category CRUD ------------------------------------------------------
  const saveCategories = (next) => {
    setCategories(next)
    // Re-home transactions whose category was deleted into "Other" if present,
    // otherwise the first remaining category.
    const ids = new Set(next.map((c) => c.id))
    if (next.length > 0) {
      const fallback = next.find((c) => c.name.toLowerCase() === 'other') || next[0]
      setTransactions((prev) =>
        prev.map((t) => (ids.has(t.categoryId) ? t : { ...t, categoryId: fallback.id })),
      )
    }
    setCatModalOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Monthly income"
          value={money(income)}
          accent="brand"
          icon={<WalletIcon width={14} height={14} />}
        />
        <Stat label="Total spent" value={money(totalSpent)} accent="slate" />
        <Stat
          label="Remaining"
          value={money(remaining)}
          accent={remaining < 0 ? 'red' : 'green'}
          sub={remaining < 0 ? 'Over your income' : 'Left to spend'}
        />
        <Stat
          label="Budgeted"
          value={money(totalBudget)}
          accent="slate"
          sub={`${categories.length} categories`}
        />
      </div>

      {/* Over-budget alert */}
      {overBudgetCats.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertIcon width={20} height={20} className="mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">
              {overBudgetCats.length === 1
                ? '1 category is over budget'
                : `${overBudgetCats.length} categories are over budget`}
            </p>
            <p className="mt-0.5 text-red-600">
              {overBudgetCats
                .map((c) => `${c.name} (${money(spentByCategory[c.id])} / ${money(c.limit)})`)
                .join(' · ')}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <IncomeCard income={income} onChange={setIncome} totalBudget={totalBudget} />
          <CategoryBudgets
            categories={categories}
            spentByCategory={spentByCategory}
            onManage={() => setCatModalOpen(true)}
          />
        </div>
        <div className="lg:col-span-2">
          <SpendingChart categories={categories} spentByCategory={spentByCategory} />
        </div>
      </div>

      <TransactionList
        transactions={transactions}
        categories={categories}
        onAdd={() => setTxModal({ open: true, editing: null })}
        onEdit={(t) => setTxModal({ open: true, editing: t })}
        onDelete={deleteTransaction}
      />

      <TransactionModal
        open={txModal.open}
        editing={txModal.editing}
        categories={categories}
        defaultDate={todayISO()}
        onClose={() => setTxModal({ open: false, editing: null })}
        onSave={saveTransaction}
      />

      <CategoryModal
        open={catModalOpen}
        categories={categories}
        spentByCategory={spentByCategory}
        onClose={() => setCatModalOpen(false)}
        onSave={saveCategories}
      />
    </div>
  )
}
