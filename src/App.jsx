import { lazy, Suspense, useId, useState } from 'react'
import { Sidebar, TabBar, TABS } from './components/Sidebar.jsx'
import DataModal from './components/DataModal.jsx'
import { DatabaseIcon } from './components/Icons.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'

// Each tab loads on demand, so the first screen downloads less (the chart
// library only comes in with the tabs that draw charts).
const BudgetSection = lazy(() => import('./sections/budget/BudgetSection.jsx'))
const InvestSection = lazy(() => import('./sections/invest/InvestSection.jsx'))
const GoalsSection = lazy(() => import('./sections/goals/GoalsSection.jsx'))
const NetWorthSection = lazy(() => import('./sections/networth/NetWorthSection.jsx'))

export default function App() {
  const [active, setActive] = useLocalStorage('fp:activeTab', 'budget')

  const [dataOpen, setDataOpen] = useState(false)

  const current = TABS.find((t) => t.id === active) || TABS[0]

  return (
    <div className="min-h-full">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-hidden bg-money px-5 py-7 text-white lg:flex">
          <SidebarOrnament />
          <Brand />
          <div className="my-7 h-px bg-gradient-to-r from-gold-400/50 via-gold-400/20 to-transparent" />
          <div className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-200/60">
            Accounts
          </div>
          <Sidebar active={active} onSelect={setActive} />
          <div className="mt-auto pt-6">
            <DataFooter onManage={() => setDataOpen(true)} />
          </div>
        </aside>

        {/* Main */}
        <main className="mx-auto min-w-0 max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-10">
          {/* Mobile header + tabs */}
          <div className="lg:hidden">
            <div className="-mx-4 -mt-5 mb-5 flex items-center justify-between bg-money px-4 py-3.5 sm:-mx-6 sm:px-6">
              <Brand compact />
              <button
                onClick={() => setDataOpen(true)}
                className="flex items-center gap-1.5 border border-white/20 px-2.5 py-1.5 text-xs font-semibold text-brand-100"
                aria-label="Backup and restore your data"
              >
                <DatabaseIcon width={14} height={14} />
                Data
              </button>
            </div>
            <TabBar active={active} onSelect={setActive} />
          </div>

          <header className="mb-8 mt-6 lg:mt-0">
            <div className="eyebrow">FinPilot · Private Wealth</div>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-slate-900 sm:text-[2.6rem]">
              {current.label}
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] text-slate-500">{sectionSubtitle(active)}</p>
          </header>

          <Suspense fallback={<LoadingCards />}>
            {current.id === 'budget' && <BudgetSection />}
            {current.id === 'invest' && <InvestSection />}
            {current.id === 'goals' && <GoalsSection />}
            {current.id === 'networth' && <NetWorthSection />}
          </Suspense>
        </main>
      </div>
      <DataModal open={dataOpen} onClose={() => setDataOpen(false)} />
    </div>
  )
}

function sectionSubtitle(id) {
  switch (id) {
    case 'budget':
      return 'Set limits, log transactions, and keep a close eye on where your money goes.'
    case 'invest':
      return 'Find your risk profile and see how steady contributions can compound over time.'
    case 'goals':
      return 'Build toward each savings goal and stay on pace to reach it.'
    case 'networth':
      return 'Everything you own minus everything you owe, tracked over time.'
    default:
      return ''
  }
}

function Brand({ compact = false }) {
  return (
    <div className="relative flex items-center gap-3">
      <Crest className={compact ? 'h-9 w-9' : 'h-11 w-11'} />
      <div className="leading-none">
        <div className={`font-display font-semibold tracking-tight text-white ${compact ? 'text-xl' : 'text-2xl'}`}>
          FinPilot
        </div>
        {!compact && (
          <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold-300/90">
            Private Wealth
          </div>
        )}
      </div>
    </div>
  )
}

// Gold monogram seal (squared).
function Crest({ className = '' }) {
  // Each crest needs its own gradient id: a gradient defined inside a hidden
  // (display:none) copy won't resolve for the visible one.
  const gold = `crest-gold-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2db99" />
          <stop offset="0.55" stopColor="#e0b04a" />
          <stop offset="1" stopColor="#a97a1f" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" fill="none" stroke={`url(#${gold})`} strokeWidth="1.5" />
      <rect x="5.5" y="5.5" width="37" height="37" fill="#082c1c" stroke={`url(#${gold})`} strokeWidth="0.75" />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="21"
        fontWeight="700"
        fill={`url(#${gold})`}
      >
        F
      </text>
    </svg>
  )
}

// Thin gold edge on the sidebar.
function SidebarOrnament() {
  return (
    <div aria-hidden="true">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-gold-400/40 via-gold-400/10 to-gold-400/40" />
    </div>
  )
}

function LoadingCards() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-[104px] animate-pulse" />
        ))}
      </div>
      <div className="card h-64 animate-pulse" />
    </div>
  )
}

function DataFooter({ onManage }) {
  return (
    <div className="relative rounded-xl border border-white/10 bg-white/[0.04] p-3.5 text-xs text-brand-100/80">
      <p className="flex items-center gap-1.5 font-semibold text-gold-300">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        Private by design
      </p>
      <p className="mt-1 leading-relaxed">
        All data is stored only in this browser (localStorage). Nothing is sent to a
        server.
      </p>
      <button
        onClick={onManage}
        className="mt-3 flex w-full items-center justify-center gap-2 border border-gold-400/40 px-3 py-2 font-semibold text-gold-300 transition hover:bg-white/[0.06]"
      >
        <DatabaseIcon width={14} height={14} />
        Backup &amp; restore
      </button>
    </div>
  )
}
