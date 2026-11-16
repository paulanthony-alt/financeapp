import { useMemo } from 'react'
import { Card, CardHeader } from '../../components/ui/Card.jsx'
import { portfolioIdeas } from '../../lib/ideas.js'
import { SparkIcon } from '../../components/Icons.jsx'

const KIND = {
  stocks: { label: 'Stocks', cls: 'bg-brand-50 text-brand-800 ring-brand-200' },
  bonds: { label: 'Bonds', cls: 'bg-gold-50 text-gold-800 ring-gold-200' },
  general: { label: 'Plan', cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
}

export default function IdeasCard({ summary, profile, contribution }) {
  const ideas = useMemo(() => portfolioIdeas(summary, profile, contribution), [summary, profile, contribution])

  return (
    <Card>
      <CardHeader
        title="Ideas for your portfolio"
        subtitle={
          summary
            ? 'Stock and bond ideas based on what you hold and your target mix, worked out in your browser'
            : 'Common starting points; import your positions for ideas based on what you hold'
        }
      />
      <ol className="space-y-3">
        {ideas.map((idea) => (
          <li key={idea.id} className="border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <SparkIcon width={16} height={16} className="shrink-0 text-gold-600" />
              <h4 className="font-semibold text-slate-900">{idea.title}</h4>
              <span className={`chip ring-1 ${KIND[idea.kind].cls}`}>{KIND[idea.kind].label}</span>
            </div>
            <p className="mt-1.5 text-sm text-slate-700">{idea.why}</p>
            {idea.funds.length > 0 && (
              <ul className="mt-2.5 flex flex-wrap gap-2" aria-label="Funds to look at">
                {idea.funds.map((f) => (
                  <li key={f.symbol} className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
                    <span className="font-bold text-slate-900">{f.symbol}</span>
                    <span className="text-slate-600"> · {f.name} · {f.er}%/yr</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-600">To weigh: </span>
              {idea.weigh}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs text-slate-400">
        These are educational ideas from simple rules, not personal financial advice. They favor broad, low-cost
        funds and don’t try to predict which stocks will rise. For market-aware ideas and IPO verdicts, see your
        scheduled investing brief and IPO watch reports.
      </p>
    </Card>
  )
}
