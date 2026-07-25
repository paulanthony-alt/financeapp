import { useState } from 'react'
import { Sidebar, TabBar, TABS } from './components/Sidebar.jsx'
import BudgetSection from './sections/budget/BudgetSection.jsx'
import InvestSection from './sections/invest/InvestSection.jsx'
import GoalsSection from './sections/goals/GoalsSection.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'

export default function App() {
  const [active, setActive] = useLocalStorage('fp:activeTab', 'budget')

  const current = TABS.find((t) => t.id === active) || TABS[0]

  return (
    <div className="min-h-full">
      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:flex">
          <Brand />
          <div className="mt-8">
            <Sidebar active={active} onSelect={setActive} />
          </div>
          <div className="mt-auto pt-6">
            <DataFooter />
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {/* Mobile header + tabs */}
          <div className="lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <Brand compact />
            </div>
            <TabBar active={active} onSelect={setActive} />
          </div>

          <header className="mb-6 mt-5 lg:mt-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {current.label}
            </h1>
            <p className="text-sm text-slate-500">{sectionSubtitle(active)}</p>
          </header>

          {active === 'budget' && <BudgetSection />}
          {active === 'invest' && <InvestSection />}
          {active === 'goals' && <GoalsSection />}
        </main>
      </div>
    </div>
  )
}

function sectionSubtitle(id) {
  switch (id) {
    case 'budget':
      return 'Set limits, log transactions, and watch your spending by category.'
    case 'invest':
      return 'Find a risk profile and see how contributions could grow over time.'
    case 'goals':
      return 'Create savings goals and stay on pace to hit them.'
    default:
      return ''
  }
}

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M17 7h4v4" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-lg font-extrabold tracking-tight text-slate-900">FinPilot</div>
        {!compact && <div className="text-xs text-slate-400">Personal finance</div>}
      </div>
    </div>
  )
}

function DataFooter() {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-slate-100">
      <p className="font-semibold text-slate-600">Private by design</p>
      <p className="mt-1 leading-relaxed">
        All data is stored only in this browser (localStorage). Nothing is sent to a
        server.
      </p>
    </div>
  )
}
