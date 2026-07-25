import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { money, percent } from '../../lib/format.js'
import { PALETTE } from '../../lib/constants.js'
import { WalletIcon, EditIcon } from '../../components/Icons.jsx'

export default function CategoryBudgets({ categories, spentByCategory, onManage }) {
  return (
    <Card>
      <CardHeader
        title="Budget by category"
        subtitle="Spending against each category's monthly limit"
        action={
          <button className="btn-ghost" onClick={onManage}>
            <EditIcon width={16} height={16} />
            Manage
          </button>
        }
      />
      {categories.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title="No categories yet"
          message="Add spending categories to start tracking your budget."
          action={
            <button className="btn-primary" onClick={onManage}>
              Add categories
            </button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {categories.map((c, i) => {
            const spent = spentByCategory[c.id] || 0
            const limit = c.limit || 0
            const ratio = limit > 0 ? spent / limit : spent > 0 ? 1 : 0
            const over = limit > 0 && spent > limit
            return (
              <li key={c.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    />
                    <span className="truncate text-sm font-semibold text-slate-700">
                      {c.name}
                    </span>
                    {over && (
                      <span className="chip bg-red-100 text-red-600">Over</span>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-sm tabular-nums">
                    <span className={over ? 'font-bold text-red-600' : 'font-semibold text-slate-700'}>
                      {money(spent)}
                    </span>
                    <span className="text-slate-400"> / {money(limit)}</span>
                  </div>
                </div>
                <ProgressBar ratio={ratio} over={over} />
                <div className="mt-1 flex justify-between text-xs text-slate-400">
                  <span>{limit > 0 ? `${percent(ratio)} used` : 'No limit set'}</span>
                  <span>
                    {over
                      ? `${money(spent - limit)} over`
                      : limit > 0
                        ? `${money(limit - spent)} left`
                        : ''}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
