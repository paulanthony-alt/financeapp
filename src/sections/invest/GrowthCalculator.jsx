import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { projectionSeries, futureValue } from '../../lib/finance.js'
import { money, percent } from '../../lib/format.js'

export default function GrowthCalculator({ profile }) {
  const [calc, setCalc] = useLocalStorage('fp:invest:calc', {
    principal: 1000,
    monthly: 300,
    years: 25,
    rate: 6.5,
  })

  // When a profile is active, its assumed return drives the projection.
  const rate = profile ? profile.assumedReturn : calc.rate

  const update = (k) => (e) =>
    setCalc((c) => ({ ...c, [k]: Math.max(0, Number(e.target.value) || 0) }))

  const series = useMemo(
    () => projectionSeries(calc.principal, calc.monthly, rate, calc.years),
    [calc.principal, calc.monthly, calc.years, rate],
  )

  const finalBalance = futureValue(calc.principal, calc.monthly, rate, calc.years)
  const invested = calc.principal + calc.monthly * calc.years * 12
  const growth = finalBalance - invested

  return (
    <Card>
      <CardHeader
        title="Growth projection"
        subtitle={
          profile
            ? `Using the ${profile.label} profile's ${percent(rate / 100)} assumed annual return`
            : 'Illustrative compound-interest projection'
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Inputs */}
        <div className="space-y-4 lg:col-span-2">
          <Field
            label="Starting amount"
            value={calc.principal}
            onChange={update('principal')}
            prefix="$"
          />
          <Field
            label="Monthly contribution"
            value={calc.monthly}
            onChange={update('monthly')}
            prefix="$"
          />
          <div>
            <div className="flex items-center justify-between">
              <label className="label mb-0">Time horizon</label>
              <span className="text-sm font-bold text-slate-700">{calc.years} yrs</span>
            </div>
            <input
              type="range"
              min="1"
              max="45"
              value={calc.years}
              onChange={update('years')}
              className="mt-2 w-full accent-brand-600"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label mb-0">Annual return</label>
              <span className="text-sm font-bold text-slate-700">{rate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={rate}
              onChange={update('rate')}
              disabled={!!profile}
              className="mt-2 w-full accent-brand-600 disabled:opacity-50"
            />
            {profile && (
              <p className="mt-1 text-xs text-slate-400">
                Locked to the selected risk profile. Clear the profile to adjust manually.
              </p>
            )}
          </div>
        </div>

        {/* Chart + results */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Contributed" value={money(invested)} accent="slate" />
            <MiniStat label="Growth" value={money(growth)} accent="green" />
            <MiniStat label="Final balance" value={money(finalBalance)} accent="brand" />
          </div>

          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(y) => `${y}y`}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => (v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
                />
                <Tooltip
                  formatter={(v, name) => [money(v), name]}
                  labelFormatter={(y) => `Year ${y}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="invested"
                  name="Contributed"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fill="url(#gInvested)"
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fill="url(#gBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Assumes a constant {rate}% annual return compounded monthly. Real markets
            fluctuate; actual results will vary.
          </p>
        </div>
      </div>
    </Card>
  )
}

function Field({ label, value, onChange, prefix }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {prefix}
          </span>
        )}
        <input
          className={`input ${prefix ? 'pl-7' : ''}`}
          type="number"
          min="0"
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

function MiniStat({ label, value, accent }) {
  const colors = {
    slate: 'text-slate-800',
    green: 'text-emerald-600',
    brand: 'text-brand-600',
  }
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-extrabold tabular-nums ${colors[accent]}`}>{value}</p>
    </div>
  )
}
