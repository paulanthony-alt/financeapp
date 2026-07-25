import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { money } from '../../lib/format.js'
import { PALETTE } from '../../lib/constants.js'
import { ChartIcon } from '../../components/Icons.jsx'

export default function SpendingChart({ categories, spentByCategory }) {
  const [mode, setMode] = useState('pie')

  const data = useMemo(
    () =>
      categories
        .map((c, i) => ({
          name: c.name,
          spent: Math.round(spentByCategory[c.id] || 0),
          limit: Math.round(c.limit || 0),
          color: PALETTE[i % PALETTE.length],
        }))
        .filter((d) => d.spent > 0 || mode === 'bar'),
    [categories, spentByCategory, mode],
  )

  const hasSpending = categories.some((c) => (spentByCategory[c.id] || 0) > 0)

  return (
    <Card className="h-full">
      <CardHeader
        title="Spending breakdown"
        action={
          <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
            {['pie', 'bar'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-2.5 py-1 capitalize transition ${
                  mode === m ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        }
      />

      {!hasSpending ? (
        <EmptyState
          icon={<ChartIcon />}
          title="No spending yet"
          message="Log a transaction to see your spending breakdown here."
        />
      ) : mode === 'pie' ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="spent"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => money(v)} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) => <span className="text-slate-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => money(v)} cursor={{ fill: '#f1f5f9' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="limit" name="Limit" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Spent" radius={[4, 4, 0, 0]}>
                {data.map((d) => (
                  <Cell key={d.name} fill={d.spent > d.limit && d.limit > 0 ? '#ef4444' : d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
