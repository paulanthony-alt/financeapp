import { useMemo } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { projectionSeries } from '../../lib/finance.js'
import {
  monteCarlo,
  volatilityFor,
  retirementTarget,
  shareReaching,
  firstYearReaching,
} from '../../lib/simulate.js'
import { money, percent } from '../../lib/format.js'

const TOOLTIP_STYLE = {
  background: '#fffdf5',
  border: '1px solid #ecdcaf',
  borderRadius: 0,
  boxShadow: '0 8px 24px -8px rgba(31,26,20,.25)',
  fontSize: 13,
}
const RUNS = 1000
const SEED = 7
// The retirement check looks this far ahead, so it can say when you'd get there
// even if that's past the chart's horizon.
const RETIRE_LOOKAHEAD = 60

export default function GrowthCalculator({ profile, portfolioValue }) {
  const [calc, setCalc] = useLocalStorage('fp:invest:calc', {
    principal: 1000,
    monthly: 300,
    years: 25,
    rate: 6.5,
  })
  // Settings added later get defaults here, so older saved data keeps working.
  const inflation = calc.inflation ?? 2.5
  const realDollars = calc.realDollars ?? true
  const showRange = calc.showRange ?? true
  const spending = calc.retireSpending ?? ''
  const withdrawal = calc.withdrawal ?? 4
  const age = calc.age ?? ''

  // When a profile is active, its assumed return drives the projection.
  const rate = profile ? profile.assumedReturn : calc.rate
  const vol = volatilityFor(rate)

  // Default to the imported Fidelity balance whenever one exists.
  const fromPortfolio = portfolioValue != null && calc.useFidelity !== false
  const principal = fromPortfolio ? Math.max(0, portfolioValue) : calc.principal

  const setNum = (k, { min = 0, max = Infinity } = {}) => (e) =>
    setCalc((c) => ({ ...c, [k]: Math.min(max, Math.max(min, Number(e.target.value) || 0)) }))
  const setRaw = (k) => (e) =>
    setCalc((c) => ({ ...c, [k]: e.target.value === '' ? '' : Math.max(0, Number(e.target.value) || 0) }))
  const setFlag = (k) => (e) => setCalc((c) => ({ ...c, [k]: e.target.checked }))

  const shownInflation = realDollars ? inflation : 0

  // Straight line (constant return), in the chart's dollars.
  const line = useMemo(() => {
    const deflate = (y) => Math.pow(1 + shownInflation / 100, y)
    return projectionSeries(principal, calc.monthly, rate, calc.years).map((r) => ({
      year: r.year,
      balance: Math.round(r.balance / deflate(r.year)),
      invested: Math.round(r.invested / deflate(r.year)),
    }))
  }, [principal, calc.monthly, calc.years, rate, shownInflation])

  // Range of outcomes in the chart's dollars.
  const sim = useMemo(
    () =>
      showRange
        ? monteCarlo({ principal, monthly: calc.monthly, meanPct: rate, volPct: vol, years: calc.years, runs: RUNS, seed: SEED, inflationPct: shownInflation })
        : null,
    [showRange, principal, calc.monthly, rate, vol, calc.years, shownInflation],
  )

  // Retirement target is in today's dollars, so compare against today's-dollar paths.
  const target = spending > 0 ? retirementTarget(spending, withdrawal) : 0
  const simReal = useMemo(
    () =>
      target > 0
        ? monteCarlo({
            principal,
            monthly: calc.monthly,
            meanPct: rate,
            volPct: vol,
            years: Math.max(calc.years, RETIRE_LOOKAHEAD),
            runs: RUNS,
            seed: SEED,
            inflationPct: inflation,
          })
        : null,
    [target, inflation, principal, calc.monthly, rate, vol, calc.years],
  )

  const data = line.map((r, i) => ({
    ...r,
    ...(sim ? { range: [sim.years[i].p10, sim.years[i].p90], median: sim.years[i].p50 } : {}),
  }))
  const last = data[data.length - 1]
  const endMedian = sim ? last.median : last.balance

  const medianYear = simReal ? firstYearReaching(simReal.years, 'p50', target) : null
  const chanceByEnd = simReal ? shareReaching(simReal, target, calc.years) : 0
  const ageAt = (y) => (age !== '' && y != null ? Math.round(age + y) : null)

  return (
    <Card>
      <CardHeader
        title="Growth projection"
        subtitle={
          (profile
            ? `${profile.label} profile: ${percent(rate / 100)} average yearly return`
            : `${percent(rate / 100)} average yearly return`) +
          (realDollars ? `, shown in today’s dollars (${inflation}% inflation)` : ', not adjusted for inflation')
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Inputs */}
        <div className="space-y-4 lg:col-span-2">
          {portfolioValue != null && (
            <label className="flex items-center gap-2 border border-brand-200 bg-brand-50 p-3 text-sm font-semibold text-brand-800">
              <input type="checkbox" className="h-4 w-4 accent-gold-600" checked={fromPortfolio} onChange={setFlag('useFidelity')} />
              Start from my Fidelity balance ({money(portfolioValue)})
            </label>
          )}
          <Field id="gc-start" label="Starting amount" value={fromPortfolio ? Math.round(principal) : calc.principal} onChange={setNum('principal')} prefix="$" disabled={fromPortfolio} />
          <Field id="gc-monthly" label="Monthly contribution" value={calc.monthly} onChange={setNum('monthly')} prefix="$" />
          <Slider id="gc-years" label="Time horizon" value={calc.years} display={`${calc.years} yrs`} min={1} max={45} onChange={setNum('years', { min: 1, max: 45 })} />
          <Slider
            id="gc-rate"
            label="Average yearly return"
            value={rate}
            display={`${rate}%`}
            min={0}
            max={12}
            step={0.5}
            onChange={setNum('rate', { max: 12 })}
            disabled={!!profile}
            note={profile ? 'Set by your risk profile. Clear the profile to adjust it.' : null}
          />

          <div className="space-y-2.5 border-t border-slate-200 pt-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-gold-600" checked={realDollars} onChange={setFlag('realDollars')} />
              Show in today’s dollars
            </label>
            {realDollars && (
              <div className="flex items-center gap-2 pl-6 text-sm text-slate-600">
                <label htmlFor="gc-infl">Inflation</label>
                <input id="gc-infl" className="input w-20 px-2 py-1 text-right" type="number" min="0" max="10" step="0.1" value={inflation} onChange={setNum('inflation', { max: 10 })} />
                <span>% / yr</span>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-gold-600" checked={showRange} onChange={setFlag('showRange')} />
              Show a range of outcomes
            </label>
          </div>
        </div>

        {/* Chart + results */}
        <div className="min-w-0 lg:col-span-3">
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Contributed" value={money(last.invested)} accent="slate" />
            <MiniStat label={sim ? 'Typical result' : 'Final balance'} value={money(endMedian)} accent="brand" />
            <MiniStat label="Growth" value={money(endMedian - last.invested)} accent="green" />
          </div>
          {sim && (
            <p className="mt-2 text-sm text-slate-600">
              In {calc.years} years: 1 in 10 outcomes below <strong>{money(last.range[0])}</strong>, 1 in 10 above{' '}
              <strong>{money(last.range[1])}</strong>.
            </p>
          )}

          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ecdcaf" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#7d6c4c' }} tickFormatter={(y) => `${y}y`} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#7d6c4c' }}
                  tickFormatter={(v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`)}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v, name) => [Array.isArray(v) ? `${money(v[0])} – ${money(v[1])}` : money(v), name]}
                  labelFormatter={(y) => `Year ${y}${ageAt(y) != null ? ` (age ${ageAt(y)})` : ''}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {sim && (
                  <Area type="monotone" dataKey="range" name="Likely range (80%)" stroke="none" fill="#157f49" fillOpacity={0.14} isAnimationActive={false} />
                )}
                <Line type="monotone" dataKey="invested" name="Contributed" stroke="#a8946a" strokeWidth={2} dot={false} isAnimationActive={false} />
                {sim && <Line type="monotone" dataKey="median" name="Typical" stroke="#157f49" strokeWidth={3} dot={false} isAnimationActive={false} />}
                <Line
                  type="monotone"
                  dataKey="balance"
                  name={sim ? 'Steady return' : 'Balance'}
                  stroke={sim ? '#c9962c' : '#157f49'}
                  strokeWidth={sim ? 1.5 : 3}
                  strokeDasharray={sim ? '5 4' : undefined}
                  dot={false}
                  isAnimationActive={false}
                />
                {target > 0 && realDollars && (
                  <ReferenceLine y={target} stroke="#b91c1c" strokeDasharray="4 4" label={{ value: 'Retirement target', fontSize: 10, fill: '#b91c1c', position: 'insideTopLeft' }} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {sim
              ? `The range comes from ${RUNS.toLocaleString()} simulated markets with returns averaging ${rate}% a year and swinging about ${vol}% (a rule-of-thumb assumption). `
              : `Assumes a steady ${rate}% every year. `}
            Real markets differ; this is an illustration, not a forecast.
          </p>
        </div>
      </div>

      {/* Retirement target */}
      <div className="mt-6 border-t border-slate-200 pt-5">
        <h4 className="font-display text-lg font-semibold text-slate-900">Retirement target</h4>
        <p className="mt-0.5 text-sm text-slate-500">How big a nest egg you’d need, and whether this plan gets there.</p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div>
            <label className="label" htmlFor="gc-spend">Yearly spending in retirement</label>
            <div className="relative w-40">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input id="gc-spend" className="input pl-7" type="number" min="0" step="1000" placeholder="e.g. 50000" value={spending} onChange={setRaw('retireSpending')} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="gc-wd">Withdrawal rate</label>
            <div className="flex items-center gap-2">
              <input id="gc-wd" className="input w-20" type="number" min="1" max="10" step="0.1" value={withdrawal} onChange={setNum('withdrawal', { min: 1, max: 10 })} />
              <span className="text-sm text-slate-600">% / yr</span>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="gc-age">Your age now (optional)</label>
            <input id="gc-age" className="input w-24" type="number" min="0" max="100" value={age} onChange={setRaw('age')} />
          </div>
        </div>

        {target > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Nest egg needed" value={money(target)} accent="slate" sub={`${money(spending)}/yr at ${withdrawal}%, today’s dollars`} />
            <MiniStat
              label="Typical path reaches it"
              value={medianYear == null ? `Not in ${RETIRE_LOOKAHEAD} years` : `Year ${medianYear}`}
              accent={medianYear == null ? 'red' : medianYear <= calc.years ? 'brand' : 'slate'}
              sub={
                medianYear == null
                  ? 'try more saving or lower spending'
                  : [ageAt(medianYear) != null ? `at age ${ageAt(medianYear)}` : null, medianYear > calc.years ? `past your ${calc.years}-year horizon` : null]
                      .filter(Boolean)
                      .join(', ') || null
              }
            />
            <MiniStat
              label={`Chance by year ${calc.years}`}
              value={`${Math.round(chanceByEnd * 100)}%`}
              accent={chanceByEnd >= 0.75 ? 'green' : chanceByEnd >= 0.5 ? 'slate' : 'red'}
              sub="of simulated markets"
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Enter your expected yearly spending to see your target.</p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          A 4% withdrawal rate is a common starting rule of thumb, not a guarantee. Spending is in today’s dollars and
          compared against inflation-adjusted results.
        </p>
      </div>
    </Card>
  )
}

function Field({ id, label, value, onChange, prefix, disabled = false }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{prefix}</span>
        )}
        <input
          id={id}
          className={`input ${prefix ? 'pl-7' : ''} disabled:bg-slate-50 disabled:text-slate-500`}
          type="number"
          min="0"
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

function Slider({ id, label, value, display, min, max, step = 1, onChange, disabled = false, note = null }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label mb-0" htmlFor={id}>{label}</label>
        <span className="text-sm font-bold text-slate-700">{display}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled} className="mt-2 w-full accent-gold-600 disabled:opacity-50" />
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </div>
  )
}

function MiniStat({ label, value, accent, sub = null }) {
  const colors = {
    slate: 'text-slate-800',
    green: 'text-emerald-600',
    brand: 'text-brand-600',
    red: 'text-red-700',
  }
  return (
    <div className="border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-extrabold tabular-nums ${colors[accent]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}
