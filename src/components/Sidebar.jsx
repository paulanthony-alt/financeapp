import { WalletIcon, ChartIcon, TargetIcon } from './Icons.jsx'

export const TABS = [
  { id: 'budget', label: 'Budget', icon: WalletIcon, desc: 'Track income & spending' },
  { id: 'invest', label: 'Investing', icon: ChartIcon, desc: 'Risk & projections' },
  { id: 'goals', label: 'Goals', icon: TargetIcon, desc: 'Savings targets' },
]

function NavItem({ tab, active, onClick }) {
  const Icon = tab.icon
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-none px-3 py-2.5 text-left transition ${
        active ? 'bg-white/[0.08] text-white' : 'text-brand-100/75 hover:bg-white/[0.04] hover:text-white'
      }`}
    >
      {active && (
        <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gold-400" aria-hidden="true" />
      )}
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition ${
          active
            ? 'bg-gold-400/15 text-gold-300 ring-gold-400/40'
            : 'bg-white/[0.04] text-brand-100/70 ring-white/10 group-hover:text-gold-300'
        }`}
      >
        <Icon width={17} height={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">{tab.label}</span>
        <span className={`block truncate text-xs ${active ? 'text-brand-100/70' : 'text-brand-100/50'}`}>
          {tab.desc}
        </span>
      </span>
    </button>
  )
}

export function Sidebar({ active, onSelect, className = '' }) {
  return (
    <nav className={`flex flex-col gap-1 ${className}`}>
      {TABS.map((tab) => (
        <NavItem
          key={tab.id}
          tab={tab}
          active={active === tab.id}
          onClick={() => onSelect(tab.id)}
        />
      ))}
    </nav>
  )
}

// Horizontal tab bar for mobile.
export function TabBar({ active, onSelect }) {
  return (
    <div className="flex gap-1 border border-slate-200 bg-white p-1 shadow-card">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-1 items-center justify-center gap-2 rounded-none px-2 py-2 text-sm font-semibold transition ${
              isActive ? 'bg-brand-800 text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            <Icon width={16} height={16} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
