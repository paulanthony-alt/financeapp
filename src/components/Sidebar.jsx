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
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
        active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-white'
        }`}
      >
        <Icon width={18} height={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-tight">{tab.label}</span>
        <span
          className={`block truncate text-xs ${active ? 'text-white/70' : 'text-slate-400'}`}
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
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold transition ${
              isActive ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
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
