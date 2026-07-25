import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { RISK_PROFILES, ALLOCATION_COLORS } from '../../lib/constants.js'
import { percent } from '../../lib/format.js'
import { ChartIcon } from '../../components/Icons.jsx'

export default function AllocationCard({ profile, complete, activeProfileId, onPick }) {
  const data = profile
    ? Object.entries(profile.allocation).map(([name, value]) => ({ name, value }))
    : []

  return (
    <Card className="h-full">
      <CardHeader
        title="Suggested allocation"
        subtitle={profile ? profile.label : 'Complete the questionnaire'}
      />

      {!profile ? (
        <EmptyState
          icon={<ChartIcon />}
          title={complete ? 'Pick a profile' : 'Not enough answers yet'}
          message="Answer all questions, or choose a profile below to see a sample asset mix."
        />
      ) : (
        <>
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={ALLOCATION_COLORS[d.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Est. return
              </span>
              <span className="text-xl font-extrabold text-slate-800">
                {percent(profile.assumedReturn / 100)}
              </span>
            </div>
          </div>

          <ul className="mt-3 space-y-1.5">
            {data.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ALLOCATION_COLORS[d.name] || '#94a3b8' }}
                  />
                  {d.name}
                </span>
                <span className="font-semibold tabular-nums text-slate-800">{d.value}%</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs leading-relaxed text-slate-500">{profile.blurb}</p>
        </>
      )}

      {/* Manual profile picker */}
      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Or explore a profile
        </p>
        <div className="flex gap-1.5">
          {Object.values(RISK_PROFILES).map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold capitalize transition ${
                activeProfileId === p.id
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
