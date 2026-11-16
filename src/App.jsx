import { Sidebar, TabBar, TABS } from './components/Sidebar.jsx'
import BudgetSection from './sections/budget/BudgetSection.jsx'
import InvestSection from './sections/invest/InvestSection.jsx'
import GoalsSection from './sections/goals/GoalsSection.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'

const MONEYBAG = `${import.meta.env.BASE_URL}moneybag.png`

export default function App() {
  const [active, setActive] = useLocalStorage('fp:activeTab', 'budget')

  const current = TABS.find((t) => t.id === active) || TABS[0]

  return (
    <div className="min-h-full">
      <div className="flex">
        {/* Desktop sidebar — the vault */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col overflow-hidden border-r-4 border-ink bg-money px-4 py-6 text-white lg:flex">
          <VaultRivets />
          <Brand />
          <div className="mt-8">
            <Sidebar active={active} onSelect={setActive} />
          </div>
          <div className="mt-auto pt-6">
            <DataFooter />
          </div>
        </aside>

        {/* Main */}
        <main className="mx-auto min-w-0 max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          {/* Mobile header + tabs */}
          <div className="lg:hidden">
            <div className="-mx-4 -mt-5 mb-4 flex items-center justify-between border-b-4 border-ink bg-money px-4 py-3 sm:-mx-6 sm:px-6">
              <Brand compact />
            </div>
            <TabBar active={active} onSelect={setActive} />
          </div>

          <header className="mb-7 mt-6 lg:mt-0">
            <div className="flex items-center gap-3">
              <span className="coin h-10 w-10 text-xl" aria-hidden="true">$</span>
              <h1 className="title-gold text-4xl sm:text-5xl">{current.label}</h1>
            </div>
            <p className="mt-2 font-serif text-base italic text-slate-600">
              {sectionSubtitle(active)}
            </p>
            <div className="mt-4 h-1.5 w-40 rounded-full border-2 border-ink bg-gold" aria-hidden="true" />
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
      return 'Count every coin — set limits, log transactions, and watch where the money goes.'
    case 'invest':
      return 'Find your risk profile and watch your fortune compound over time.'
    case 'goals':
      return 'Fill the vault one goal at a time and stay on pace to hit each one.'
    default:
      return ''
  }
}

function Brand({ compact = false }) {
  return (
    <div className="relative flex items-center gap-3">
      <img
        src={MONEYBAG}
        alt=""
        className={`animate-jingle drop-shadow-[3px_3px_0_#2f271d] ${compact ? 'h-10 w-auto' : 'h-14 w-auto'}`}
      />
      <div className="leading-none">
        <div className={`title-gold ${compact ? 'text-2xl' : 'text-3xl'}`}>FinPilot</div>
        {!compact && (
          <div className="mt-1.5 font-serif text-sm italic text-gold-200">Your personal money bin</div>
        )}
      </div>
    </div>
  )
}

// Decorative vault-door rivets in the sidebar corners.
function VaultRivets() {
  const rivet = 'absolute h-3 w-3 rounded-full border-2 border-ink bg-gold shadow-coin'
  return (
    <div aria-hidden="true">
      <span className={`${rivet} left-2 top-2`} />
      <span className={`${rivet} right-2 top-2`} />
      <span className={`${rivet} bottom-2 left-2`} />
      <span className={`${rivet} bottom-2 right-2`} />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full border-[10px] border-gold-500/20" />
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full border-[6px] border-gold-500/20" />
    </div>
  )
}

function DataFooter() {
  return (
    <div className="relative rounded-xl border-2 border-ink bg-vault/70 p-3 text-xs text-brand-100 shadow-comic-sm">
      <p className="flex items-center gap-1.5 font-extrabold uppercase tracking-widest text-gold-300">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        Locked in the vault
      </p>
      <p className="mt-1 leading-relaxed">
        All data is stored only in this browser (localStorage). Nothing is sent to a
        server.
      </p>
    </div>
  )
}
