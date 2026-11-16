// Rule-based investment ideas from the user's own portfolio. Runs in the browser;
// nothing is sent anywhere. Every idea says why it applies and what to weigh.
// Educational, not advice: ideas name low-cost funds from the reference table
// (src/lib/funds.js) rather than predicting which stocks will do well.
import { FUNDS, isIndividualStock, overlapWarnings } from './funds.js'
import { rebalanceWithContribution } from './rebalance.js'

const fund = (symbol) => ({ symbol, ...FUNDS[symbol] })
const pct = (x) => `${Math.round(x * 100)}%`
const usd = (x) => `$${Math.round(x).toLocaleString('en-US')}`

/**
 * @param summary       summarizePortfolio() result, or null when nothing is imported
 * @param profile       selected risk profile (with .allocation), or null
 * @param contribution  the user's next contribution in dollars (from the rebalance card)
 * @returns Array<{ id, kind: 'stocks'|'bonds'|'general', title, why, funds, weigh, priority }>
 */
export function portfolioIdeas(summary, profile, contribution = 0) {
  if (!summary || summary.total <= 0) return starterIdeas()

  const ideas = []
  const total = summary.total
  const rows = summary.rows
  const tracks = (r) => FUNDS[r.symbol]?.tracks
  const stockRows = rows.filter((r) => r.cls === 'Stocks')
  const stockValue = stockRows.reduce((s, r) => s + r.value, 0)
  const intlValue = rows.filter((r) => ['intl-total', 'intl-developed'].includes(tracks(r))).reduce((s, r) => s + r.value, 0)
  const singles = rows.filter((r) => isIndividualStock(r))
  const singleShare = singles.reduce((s, r) => s + r.value, 0) / total
  const bondShare = (summary.byClass.Bonds || 0) / total
  const plan = profile && contribution > 0 ? rebalanceWithContribution(lookThrough(summary), profile.allocation, contribution) : null

  // 1. Concentration in individual companies.
  if (singleShare >= 0.25) {
    const broad = rows.find((r) => ['us-total', 'sp500'].includes(tracks(r)))
    ideas.push({
      id: 'diversify-singles',
      kind: 'stocks',
      priority: 1,
      title: 'Send new money to a broad index fund instead of more single stocks',
      why: `${pct(singleShare)} of your portfolio is in ${singles.length} individual ${singles.length === 1 ? 'company' : 'companies'}. Adding to a fund that holds hundreds of companies lowers that share over time without selling anything (so no tax).`,
      funds: broad ? [fund(broad.symbol), fund(broad.symbol === 'FSKAX' ? 'FXAIX' : 'FSKAX')] : [fund('FSKAX'), fund('FXAIX')],
      weigh: 'Your single stocks may keep outperforming; this trades some upside for less risk of one company dragging the whole portfolio down.',
    })
  }

  // 2. No (or very little) international.
  if (stockValue > 0 && intlValue / stockValue < 0.1) {
    ideas.push({
      id: 'add-international',
      kind: 'stocks',
      priority: 2,
      title: 'Add international stocks',
      why: `${intlValue > 0 ? `Only ${pct(intlValue / stockValue)}` : 'None'} of your stock money is outside the US. Companies outside the US are a large share of the world’s stock market, and they haven’t always moved in step with US stocks.`,
      funds: [fund('FTIHX'), fund('FZILX')],
      weigh: 'International stocks lagged US stocks for much of the 2010s; there’s no guarantee either way. FZILX (a Fidelity ZERO fund) can only be held at Fidelity.',
    })
  }

  // 3. Bonds versus the target.
  const bondTarget = profile ? profile.allocation.Bonds / 100 : null
  if (bondTarget != null && bondTarget - bondShare >= 0.05) {
    const buy = plan?.buys?.Bonds
    ideas.push({
      id: 'add-bonds',
      kind: 'bonds',
      priority: 2,
      title: 'Add bonds to reach your target mix',
      why: `Bonds are ${pct(bondShare)} of your portfolio versus your ${profile.label.toLowerCase()} target of ${pct(bondTarget)}.${buy > 0 ? ` Of your next ${usd(contribution)}, about ${usd(buy)} would go to bonds.` : ''} Bonds usually fall less than stocks in a crash, which cushions the portfolio.`,
      funds: [fund('FXNAX'), fund('BND')],
      weigh: 'Bonds earn less than stocks over long periods, and bond funds lose value when interest rates rise.',
    })
  } else if (bondTarget == null && bondShare === 0) {
    ideas.push({
      id: 'decide-bonds',
      kind: 'bonds',
      priority: 3,
      title: 'Decide whether you want bonds',
      why: 'You hold no bonds. That’s common for people with decades to go, but it means bigger swings. Pick a risk profile below and this card will tell you how much, if any, to add.',
      funds: [fund('FXNAX'), fund('BND')],
      weigh: 'With a long horizon, more stocks has historically meant more growth and bigger drops along the way.',
    })
  }

  // 4. Owning the same index twice, or paying more than needed.
  for (const w of overlapWarnings(rows)) {
    if (w.kind === 'duplicate') {
      ideas.push({
        id: `consolidate-${w.symbols.join('-')}`,
        kind: 'stocks',
        priority: 3,
        title: 'Pick one fund per index for new money',
        why: w.text,
        funds: w.symbols.filter((s) => FUNDS[s]).map(fund),
        weigh: 'Keep what you have (selling could be taxable); just stop splitting new money between them.',
      })
    }
  }
  for (const r of rows) {
    const cheaper = FUNDS[r.symbol]?.cheaper
    if (cheaper && FUNDS[r.symbol].er - FUNDS[cheaper].er >= 0.1) {
      ideas.push({
        id: `cheaper-${r.symbol}`,
        kind: r.cls === 'Bonds' ? 'bonds' : 'stocks',
        priority: 3,
        title: `Consider ${cheaper} for new money instead of ${r.symbol}`,
        why: `${r.symbol} charges ${FUNDS[r.symbol].er}% a year; ${cheaper} charges ${FUNDS[cheaper].er}% for similar holdings.`,
        funds: [fund(cheaper)],
        weigh: 'Check the two funds really hold the same mix before switching. Selling in a taxable account can trigger tax.',
      })
    }
  }

  // 5. Already in good shape.
  if (!ideas.length) {
    ideas.push({
      id: 'stay-course',
      kind: 'general',
      priority: 4,
      title: 'Stay the course',
      why: 'Your portfolio is diversified, low-cost, and close to your target. The biggest lever now is how much you add each month.',
      funds: [],
      weigh: 'Revisit after big life changes or once a year.',
    })
  }

  return ideas.sort((a, b) => a.priority - b.priority)
}

function lookThrough(summary) {
  const b = summary.byClass
  // Multi-asset funds count half stocks, half bonds here; the rebalance card lets
  // the user set the real split.
  return { Stocks: (b.Stocks || 0) + (b.Mixed || 0) / 2, Bonds: (b.Bonds || 0) + (b.Mixed || 0) / 2, Cash: b.Cash || 0 }
}

function starterIdeas() {
  return [
    {
      id: 'starter-core',
      kind: 'stocks',
      priority: 1,
      title: 'Start with a broad US stock index fund',
      why: 'One fund that owns most of the US stock market is a common core for long-term investing: low cost, no stock picking.',
      funds: [fund('FSKAX'), fund('FXAIX')],
      weigh: 'Stock funds can drop 30–50% in a bad year; money you need within a few years usually belongs elsewhere.',
    },
    {
      id: 'starter-intl',
      kind: 'stocks',
      priority: 2,
      title: 'Add international stocks',
      why: 'A total-international fund spreads your money across thousands of companies outside the US.',
      funds: [fund('FTIHX'), fund('FZILX')],
      weigh: 'FZILX can only be held at Fidelity.',
    },
    {
      id: 'starter-bonds',
      kind: 'bonds',
      priority: 3,
      title: 'Use a bond index fund for stability',
      why: 'Bonds smooth out the ride. How much depends on your risk profile and how soon you need the money.',
      funds: [fund('FXNAX'), fund('BND')],
      weigh: 'Bonds grow more slowly than stocks over long periods.',
    },
  ]
}
