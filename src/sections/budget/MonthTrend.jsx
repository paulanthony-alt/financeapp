import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { money } from '../../lib/format.js'
import { monthlyTotals } from '../../lib/period.js'

export default function MonthTrend({ transactions, month, totalBudget }) {
  const data = useMemo(() => monthlyTotals(transactions, month, 6), [transactions, month])
  const hasAny = data.some((d) => d.spent > 0)
  const prev = data[data.length - 2]
  const cur = data[data.length - 1]
  const delta = prev && prev.spent > 0 ? (cur.spent - prev.spent) / prev.spent : null

  return (
    <Card>
      <CardHeader
        title="Month over month"
        subtitle={
          delta == null
            ? 'Total spending, last 6 months'
            : `${money(cur.spent)} this month, ${delta >= 0 ? 'up' : 'down'} ${Math.abs(Math.round(delta * 100))}% from last month`
        }
      />
      {!hasAny ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Spending history appears here once you log transactions.
        </p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7dfcf" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#746c5e' }} />
              <YAxis tick={{ fontSize: 11, fill: '#746c5e' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v) => money(v)} cursor={{ fill: '#f4efe4' }} />
              {totalBudget > 0 && (
                <ReferenceLine y={totalBudget} stroke="#c9962c" strokeDasharray="4 4" label={{ value: 'Budget', fontSize: 10, fill: '#876019', position: 'insideTopRight' }} />
              )}
              <Bar dataKey="spent" name="Spent" isAnimationActive={false}>
                {data.map((d, i) => (
                  <Cell key={d.key} fill={totalBudget > 0 && d.spent > totalBudget ? '#b91c1c' : i === data.length - 1 ? '#157f49' : '#a6e8bf'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
