import { useRef, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { EmptyState } from '../../components/ui/EmptyState.jsx'
import { ASSET_CLASSES, parseFidelityPositions } from '../../lib/fidelity.js'
import { ALLOCATION_COLORS } from '../../lib/constants.js'
import { money, moneyCents, percent, prettyDate } from '../../lib/format.js'
import { UploadIcon, TrashIcon } from '../../components/Icons.jsx'
import { useLocalStorage } from '../../hooks/useLocalStorage.js'
import { dayChange } from '../../lib/prices.js'
import { todayISO } from '../../lib/format.js'

export default function PortfolioCard({ portfolio, summary, profile, onImport, onClear, onOverride }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [priceStatus] = useLocalStorage('fp:prices:status', null)
  const asOf = portfolio?.pricesAsOf
  const today = todayISO()
  const move = portfolio ? dayChange(portfolio.holdings) : null
  const stale = asOf && (Date.parse(today) - Date.parse(asOf)) / 86400000 > 5
  const missing = (priceStatus?.missing || []).filter((s) => portfolio?.holdings.some((h) => h.symbol === s))

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same file
    if (!file) return
    try {
      const { holdings, accountCount } = parseFidelityPositions(await file.text())
      onImport({
        holdings,
        accountCount,
        fileName: file.name,
        importedAt: new Date().toISOString(),
      })
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const importButton = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFile}
      />
      <button className="btn-primary" onClick={() => inputRef.current?.click()}>
        <UploadIcon width={16} height={16} />
        {portfolio ? 'Re-import' : 'Import CSV'}
      </button>
    </>
  )

  return (
    <Card>
      <CardHeader
        title="Your Fidelity portfolio"
        subtitle={
          portfolio
            ? (asOf ? `Prices as of ${prettyDate(asOf)} close · ` : '') +
              `Imported ${prettyDate(portfolio.importedAt.slice(0, 10))} · ${portfolio.fileName}`
            : 'Import your positions to base projections on your real balance'
        }
        action={
          <div className="flex gap-2">
            {portfolio && (
              <button
                className="btn-ghost px-3"
                onClick={() => setConfirmClear(true)}
                aria-label="Remove imported portfolio"
              >
                <TrashIcon width={16} height={16} />
              </button>
            )}
            {importButton}
          </div>
        }
      />

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {confirmClear && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">Remove the imported portfolio from this browser?</p>
          <div className="flex gap-2">
            <button
              className="btn-danger px-3 py-1.5"
              onClick={() => {
                onClear()
                setConfirmClear(false)
              }}
            >
              Remove
            </button>
            <button className="btn-ghost px-3 py-1.5" onClick={() => setConfirmClear(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!portfolio ? (
        <EmptyState
          icon={<UploadIcon />}
          title="No portfolio imported"
          message="In Fidelity, open Accounts & Trade → Portfolio → Positions and click Download. Import that CSV here — it's read in your browser and never uploaded."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat
                label="Total value"
                value={money(summary.total)}
                sub={move ? `${move.change >= 0 ? '+' : '−'}${moneyCents(Math.abs(move.change))} (${move.change >= 0 ? '+' : '−'}${percent(Math.abs(move.pct))}) last day` : null}
                tone={move ? (move.change >= 0 ? 'text-brand-700' : 'text-red-700') : undefined}
              />
              <MiniStat
                label="Holdings"
                value={summary.rows.length}
                sub={portfolio.accountCount > 1 ? `${portfolio.accountCount} accounts` : null}
              />
            </div>
            <AllocationDonut byClass={summary.byClass} total={summary.total} />
            <DriftTable byClass={summary.byClass} total={summary.total} profile={profile} />
          </div>

          <div className="min-w-0 lg:col-span-3">
            <p className="label">Holdings</p>
            <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto pr-1">
              {summary.rows.map((h) => (
                <li key={h.symbol} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{h.symbol}</p>
                    <p className="truncate text-xs text-slate-400">{h.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-800">
                      {moneyCents(h.value)}
                    </p>
                    <p className="text-xs tabular-nums text-slate-400">
                      {h.prevClose != null && h.price != null && (
                        <span className={`mr-1.5 font-semibold ${h.price >= h.prevClose ? 'text-brand-700' : 'text-red-700'}`}>
                          {h.price >= h.prevClose ? '+' : '−'}
                          {percent(Math.abs(h.price / h.prevClose - 1))}
                        </span>
                      )}
                      {percent(h.weight)}
                    </p>
                  </div>
                  <select
                    className="input w-24 shrink-0 px-2 py-1 text-xs"
                    value={h.cls}
                    onChange={(e) => onOverride(h.symbol, e.target.value)}
                    aria-label={`Asset class for ${h.symbol}`}
                  >
                    {ASSET_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-400">
              {asOf
                ? 'Values update each evening from closing prices, using the share counts from your last import. Re-import after you buy, sell, or reinvest dividends. '
                : 'Values are from your import; they start updating from daily closing prices after the next nightly price update. '}
              Asset classes are guessed from the fund name — correct any that are wrong.
            </p>
            {stale && (
              <p className="mt-2 border border-gold-300 bg-gold-50 p-2 text-xs text-slate-700">
                Prices haven’t updated since {prettyDate(asOf)}. The nightly update may have failed; values may be out of date.
              </p>
            )}
            {missing.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                No daily price for {missing.join(', ')}; {missing.length === 1 ? 'its value stays' : 'their values stay'} at your last import.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

function AllocationDonut({ byClass, total }) {
  const data = ASSET_CLASSES.filter((c) => byClass[c] > 0).map((c) => ({
    name: c,
    value: Math.round(byClass[c]),
  }))
  return (
    <div className="mt-4">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={72}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={ALLOCATION_COLORS[d.name]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#fffdf5', border: '1px solid #ecdcaf', borderRadius: 0, boxShadow: '0 8px 24px -8px rgba(31,26,20,.25)', fontSize: 13 }} formatter={(v) => `${money(v)} (${percent(v / total)})`} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function DriftTable({ byClass, total, profile }) {
  if (!profile) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        Pick a risk profile below to compare your actual mix against a target.
      </p>
    )
  }
  const mixedShare = total > 0 ? byClass.Mixed / total : 0
  return (
    <div className="mt-2">
      <p className="label">Actual vs. {profile.label} target</p>
      <ul className="space-y-1.5">
        {Object.entries(profile.allocation).map(([cls, target]) => {
          const actual = total > 0 ? (byClass[cls] / total) * 100 : 0
          const diff = actual - target
          const off = Math.abs(diff) >= 5
          return (
            <li key={cls} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ALLOCATION_COLORS[cls] }}
                />
                {cls}
              </span>
              <span className="tabular-nums">
                <span className="font-semibold text-slate-800">{actual.toFixed(0)}%</span>
                <span className="text-slate-400"> / {target}%</span>
                <span
                  className={`ml-2 inline-block w-12 text-right text-xs font-semibold ${
                    off ? 'text-amber-600' : 'text-slate-400'
                  }`}
                >
                  {diff >= 0 ? '+' : ''}
                  {diff.toFixed(0)}%
                </span>
              </span>
            </li>
          )
        })}
      </ul>
      {mixedShare > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          {percent(mixedShare)} is in multi-asset funds (target-date/balanced), which hold
          both stocks and bonds and aren’t split out above.
        </p>
      )}
    </div>
  )
}

function MiniStat({ label, value, sub, tone = 'text-slate-400' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold tabular-nums text-slate-800">{value}</p>
      {sub && <p className={`text-xs ${tone}`}>{sub}</p>}
    </div>
  )
}
