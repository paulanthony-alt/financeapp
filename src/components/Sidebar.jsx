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
      className={`group flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
        active
          ? 'translate-x-1 border-ink bg-gold text-ink shadow-comic'
          : 'border-transparent text-brand-100 hover:border-gold-400/40 hover:bg-white/5'
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
          active
            ? 'border-ink bg-brand-700 text-gold-300'
            : 'border-gold-500/50 bg-vault text-gold-300 group-hover:border-gold-400'
        }`}
      >
        <Icon width={18} height={18} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-lg leading-tight tracking-wide">{tab.label}</span>
        <span
          className={`block truncate text-xs font-semibold ${active ? 'text-ink/70' : 'text-brand-200/70'}`}
        >
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
    <div className="flex gap-1.5 rounded-2xl border-2 border-ink bg-money p-1.5 shadow-comic">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-2 py-2 font-display text-base tracking-wide transition ${
              isActive ? 'border-ink bg-gold text-ink shadow-comic-sm' : 'border-transparent text-brand-100'
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
