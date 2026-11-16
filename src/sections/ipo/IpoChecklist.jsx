import { Card, CardHeader } from '../../components/ui/Card.jsx'

const CHECKS = [
  ['Read the prospectus', 'Once it files publicly, the S-1 on SEC EDGAR shows revenue, growth, profits or losses, and a “Risk Factors” section. Use the SEC filings link on each company.'],
  ['Compare the price to similar companies', 'Look at the IPO valuation against revenue or earnings of similar public companies. A hot IPO is often priced richly.'],
  ['Expect a bumpy start', 'First-day jumps usually go to investors who got shares at the offer price. Buying when trading opens often means paying that jump.'],
  ['Mind the lock-up', 'Insiders are usually barred from selling for about 90–180 days. When that ends, extra selling can weigh on the price.'],
  ['Wait for real results', 'Many long-term investors wait for one or two quarterly earnings reports as a public company before buying.'],
  ['Keep it small', 'A new stock is one company with a short public track record. Many long-term investors cap any single new stock at a small slice of their portfolio.'],
]

export default function IpoChecklist() {
  return (
    <Card>
      <CardHeader title="Before you buy an IPO" subtitle="A checklist for long-term investors" />
      <ol className="grid gap-3 sm:grid-cols-2">
        {CHECKS.map(([title, text], i) => (
          <li key={title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-brand-800 text-xs font-bold text-white">{i + 1}</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="text-sm text-slate-600">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-xs text-slate-500">
        On average, US IPOs have underperformed comparable companies over the three to five years after listing
        (Jay Ritter, University of Florida, long-running IPO data). Some do very well; the average doesn’t. Your IPO
        watch report gives a verdict for each company as it gets close to listing. Educational, not advice.
      </p>
    </Card>
  )
}
