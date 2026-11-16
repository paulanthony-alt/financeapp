import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { DEFAULT_CATEGORIES } from '../../lib/constants.js'
import { uid, money, todayISO } from '../../lib/format.js'
import { currentMonthKey, shiftMonth, inMonth, sumByCategory } from '../../lib/period.js'
import { dueTransactions, skipMonth } from '../../lib/recurring.js'
import { Stat } from '../../components/ui/Stat.jsx'
import { WalletIcon, PlusIcon, AlertIcon } from '../../components/Icons.jsx'
import IncomeCard from './IncomeCard.jsx'
import CategoryBudgets from './CategoryBudgets.jsx'
import TransactionList from './TransactionList.jsx'
import TransactionModal from './TransactionModal.jsx'
import CategoryModal from './CategoryModal.jsx'
import MonthNav from './MonthNav.jsx'
import RecurringCard from './RecurringCard.jsx'
import RecurringModal from './RecurringModal.jsx'
import GoalsBudgetCard from './GoalsBudgetCard.jsx'

// Charts load after the numbers and lists have already rendered.
const SpendingChart = lazy(() => import('./SpendingChart.jsx'))
const MonthTrend = lazy(() => import('./MonthTrend.jsx'))
const ChartPlaceholder = () => <div className="card h-64 animate-pulse" aria-hidden="true" />

const seedCategories = () =>
  DEFAULT_CATEGORIES.map((c) => ({ id: uid(), name: c.name, limit: c.limit }))

export default function BudgetSection() {
  const [income, setIncome] = useLocalStorage('fp:budget:income', 4200)
  const [categories, setCategories] = useLocalStorage('fp:budget:categories', seedCategories)
  const [transactions, setTransactions] = useLocalStorage('fp:budget:transactions', [])
  const [recurring, setRecurring] = useLocalStorage('fp:budget:recurring', [])
  const [goals, setGoals] = useLocalStorage('fp:goals', [])

  const currentMonth = currentMonthKey()
  const [month, setMonth] = useState(currentMonth)

  const [txModal, setTxModal] = useState({ open: false, editing: null })
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [recModal, setRecModal] = useState({ open: false, editing: null })

  // Recurring rules create their transactions as each month comes due.
  useEffect(() => {
    const due = dueTransactions(recurring, transactions, currentMonth, todayISO(), uid)
    if (due.length) setTransactions((prev) => [...due, ...prev])
  }, [recurring, transactions, currentMonth, setTransactions])

  // --- Derived aggregates (for the selected month) --------------------------
  const monthTransactions = useMemo(() => inMonth(transactions, month), [transactions, month])
  const spentByCategory = useMemo(
    () => sumByCategory(categories, monthTransactions),
    [categories, monthTransactions],
  )
  const totalSpent = useMemo(
    () => monthTransactions.reduce((s, t) => s + t.amount, 0),
    [monthTransactions],
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
  const deleteTransaction = (id) => {
    const tx = transactions.find((t) => t.id === id)
    // Deleting a generated transaction means "skip this month" — don't recreate it.
    if (tx?.recurringId) setRecurring((prev) => skipMonth(prev, tx.recurringId, tx.recurringMonth))
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  // --- Recurring rule CRUD ----------------------------------------------------
  const saveRecurring = (data) => {
    if (data.id) {
      setRecurring((prev) => prev.map((r) => (r.id === data.id ? { ...r, ...data } : r)))
    } else {
      setRecurring((prev) => [...prev, { ...data, id: uid(), active: true, skipped: [] }])
    }
    setRecModal({ open: false, editing: null })
  }
  const deleteRecurring = (id) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id))
    // Detach (but keep) past transactions so history stays intact.
    setTransactions((prev) =>
      prev.map((t) => (t.recurringId === id ? { ...t, recurringId: undefined, recurringMonth: undefined } : t)),
    )
  }
  const toggleRecurring = (id) =>
    setRecurring((prev) => prev.map((r) => (r.id === id ? { ...r, active: r.active === false } : r)))

  const contributeToGoal = (goalId, amount) =>
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, saved: g.saved + amount } : g)))

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
      <MonthNav month={month} current={currentMonth} onChange={setMonth} shift={shiftMonth} />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Monthly income"
          value={money(income)}
          accent="brand"
          icon={<WalletIcon width={14} height={14} />}
        />
        <Stat label="Spent this month" value={money(totalSpent)} accent="slate" />
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
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
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
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ChartPlaceholder />}>
            <SpendingChart categories={categories} spentByCategory={spentByCategory} />
          </Suspense>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<ChartPlaceholder />}>
          <MonthTrend transactions={transactions} month={month} totalBudget={totalBudget} />
        </Suspense>
        <GoalsBudgetCard goals={goals} income={income} spent={totalSpent} onContribute={contributeToGoal} />
      </div>

      <RecurringCard
        rules={recurring}
        categories={categories}
        onAdd={() => setRecModal({ open: true, editing: null })}
        onEdit={(r) => setRecModal({ open: true, editing: r })}
        onDelete={deleteRecurring}
        onToggle={toggleRecurring}
      />

      <TransactionList
        transactions={monthTransactions}
        categories={categories}
        onAdd={() => setTxModal({ open: true, editing: null })}
        onEdit={(t) => setTxModal({ open: true, editing: t })}
        onDelete={deleteTransaction}
      />

      <TransactionModal
        open={txModal.open}
        editing={txModal.editing}
        categories={categories}
        defaultDate={month === currentMonth ? todayISO() : `${month}-01`}
        onClose={() => setTxModal({ open: false, editing: null })}
        onSave={saveTransaction}
      />

      <RecurringModal
        open={recModal.open}
        editing={recModal.editing}
        categories={categories}
        currentMonth={currentMonth}
        onClose={() => setRecModal({ open: false, editing: null })}
        onSave={saveRecurring}
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
