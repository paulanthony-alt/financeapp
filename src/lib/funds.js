// Reference data for common index funds: expense ratio and what each one tracks,
// used for the cost and overlap checks. Expense ratios change; this table was
// compiled for FinPilot in November 2026 and every value can be overridden in the
// app. Always confirm on the fund's own page.
import { futureValue } from './finance.js'

export const FUNDS_CHECKED = 'November 2026'

// er: expense ratio in percent per year. tracks: what the fund holds, for overlap.
export const FUNDS = {
  // Fidelity
  FXAIX: { name: 'Fidelity 500 Index', er: 0.015, tracks: 'sp500' },
  FSKAX: { name: 'Fidelity Total Market Index', er: 0.015, tracks: 'us-total' },
  FZROX: { name: 'Fidelity ZERO Total Market Index', er: 0, tracks: 'us-total' },
  FZILX: { name: 'Fidelity ZERO International Index', er: 0, tracks: 'intl-total' },
  FTIHX: { name: 'Fidelity Total International Index', er: 0.06, tracks: 'intl-total' },
  FSPSX: { name: 'Fidelity International Index', er: 0.035, tracks: 'intl-developed' },
  FXNAX: { name: 'Fidelity US Bond Index', er: 0.025, tracks: 'us-bond-agg' },
  FIPFX: { name: 'Fidelity Freedom Index 2050', er: 0.12, tracks: 'target-date' },
  FFFHX: { name: 'Fidelity Freedom 2050', er: 0.75, tracks: 'target-date', cheaper: 'FIPFX' },
  SPAXX: { name: 'Fidelity Government Money Market', er: 0.42, tracks: 'cash' },
  // Vanguard
  VOO: { name: 'Vanguard S&P 500 ETF', er: 0.03, tracks: 'sp500' },
  VFIAX: { name: 'Vanguard 500 Index Admiral', er: 0.04, tracks: 'sp500' },
  VTI: { name: 'Vanguard Total Stock Market ETF', er: 0.03, tracks: 'us-total' },
  VTSAX: { name: 'Vanguard Total Stock Market Admiral', er: 0.04, tracks: 'us-total' },
  BND: { name: 'Vanguard Total Bond Market ETF', er: 0.03, tracks: 'us-bond-agg' },
  // iShares / SPDR / Schwab / Invesco
  IVV: { name: 'iShares Core S&P 500 ETF', er: 0.03, tracks: 'sp500' },
  SPY: { name: 'SPDR S&P 500 ETF', er: 0.0945, tracks: 'sp500', cheaper: 'FXAIX' },
  ITOT: { name: 'iShares Core S&P Total US Stock Market ETF', er: 0.03, tracks: 'us-total' },
  AGG: { name: 'iShares Core US Aggregate Bond ETF', er: 0.03, tracks: 'us-bond-agg' },
  SCHB: { name: 'Schwab US Broad Market ETF', er: 0.03, tracks: 'us-total' },
  SCHX: { name: 'Schwab US Large-Cap ETF', er: 0.03, tracks: 'us-large' },
  QQQ: { name: 'Invesco QQQ Trust', er: 0.2, tracks: 'nasdaq100', cheaper: 'QQQM' },
  QQQM: { name: 'Invesco Nasdaq 100 ETF', er: 0.15, tracks: 'nasdaq100' },
}

// Large companies that are long-standing S&P 500 members (so also in total-market
// funds). Used to spot owning a stock directly and again through an index fund.
export const SP500_GIANTS = new Set([
  'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'BRK.B', 'AVGO', 'JPM', 'LLY',
  'V', 'MA', 'UNH', 'XOM', 'COST', 'WMT', 'JNJ', 'PG', 'HD', 'NFLX', 'ORCL', 'BAC', 'KO', 'PEP',
  'ABBV', 'CVX', 'MRK', 'ADBE', 'CRM', 'AMD', 'DIS', 'MCD', 'CSCO', 'INTC', 'QCOM', 'IBM',
])

const FUND_WORDS = /\b(FUND|INDEX|ETF|TRUST|PORTFOLIO|MONEY MARKET|FREEDOM|SPDR|ISHARES|VANGUARD|SHARES)\b/
const COMPANY_WORDS = /\b(INC|CORP|CORPORATION|CO|COM|LTD|PLC|HOLDINGS|PLATFORMS|GROUP|CL [A-C]|CLASS [A-C])\b/

/** A company's own shares (not a fund), judged from the symbol and Fidelity's description. */
export function isIndividualStock({ symbol = '', description = '' }) {
  if (FUNDS[symbol]) return false
  const desc = description.toUpperCase()
  return /^[A-Z]{1,5}(\.[A-Z])?$/.test(symbol) && !FUND_WORDS.test(desc) && COMPANY_WORDS.test(desc)
}

const LABEL = {
  sp500: 'the S&P 500',
  'us-total': 'the total US stock market',
  'us-large': 'US large companies',
  'intl-total': 'total international stocks',
  'intl-developed': 'developed international stocks',
  'us-bond-agg': 'the US bond market',
  nasdaq100: 'the Nasdaq-100',
}

/** Expense ratio (%) for a holding: user override, then the table, 0 for an
 *  individual stock (no fund fee), else null. Accepts a symbol or a holding row. */
export function expenseRatio(holding, overrides = {}) {
  const row = typeof holding === 'string' ? { symbol: holding } : holding
  const { symbol } = row
  if (overrides[symbol] != null && overrides[symbol] !== '') return Number(overrides[symbol])
  if (FUNDS[symbol]) return FUNDS[symbol].er
  return isIndividualStock(row) ? 0 : null
}

/**
 * Yearly fund costs.
 * @param rows  holdings with { symbol, value }
 * @returns {{ rows, known, unknown, yearly, weightedEr, coverage }}
 */
export function fundCosts(rows, overrides = {}) {
  let yearly = 0
  let knownValue = 0
  const total = rows.reduce((s, r) => s + r.value, 0)
  const out = rows.map((r) => {
    const er = expenseRatio(r, overrides)
    const cost = er == null ? null : (r.value * er) / 100
    if (cost != null) {
      yearly += cost
      knownValue += r.value
    }
    const ref = FUNDS[r.symbol]
    const cheaper = ref?.cheaper ? { symbol: ref.cheaper, ...FUNDS[ref.cheaper] } : null
    return {
      ...r,
      er,
      cost,
      source:
        overrides[r.symbol] != null && overrides[r.symbol] !== ''
          ? 'you'
          : ref
            ? 'table'
            : isIndividualStock(r)
              ? 'stock'
              : null,
      cheaper: cheaper && er != null && er - cheaper.er >= 0.1 ? cheaper : null,
    }
  })
  return {
    rows: out,
    yearly,
    weightedEr: knownValue > 0 ? (yearly / knownValue) * 100 : null,
    coverage: total > 0 ? knownValue / total : 0,
    unknown: out.filter((r) => r.er == null),
  }
}

/** Growth lost to fees: balance without fees minus balance with them. */
export function feeDrag(balance, ratePct, erPct, years, monthly = 0) {
  return futureValue(balance, monthly, ratePct, years) - futureValue(balance, monthly, ratePct - erPct, years)
}

function joinList(items) {
  if (items.length <= 2) return items.join(' and ')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/** Overlap and concentration warnings between holdings. Rows need { symbol, description, value }. */
export function overlapWarnings(rows) {
  const tracked = rows
    .map((r) => ({ symbol: r.symbol, tracks: FUNDS[r.symbol]?.tracks }))
    .filter((r) => r.tracks && r.tracks !== 'cash')
  const by = {}
  for (const r of tracked) (by[r.tracks] ||= []).push(r.symbol)
  const has = (t) => (by[t] || []).length > 0
  const list = (t) => by[t].join(' and ')
  const out = []

  for (const [t, syms] of Object.entries(by)) {
    if (syms.length > 1 && t !== 'target-date') {
      out.push({
        kind: 'duplicate',
        symbols: syms,
        text: `${list(t)} all track ${LABEL[t] || t}. Owning more than one adds no diversification; you could direct new money to just one.`,
      })
    }
  }
  if (has('sp500') && has('us-total')) {
    out.push({
      kind: 'overlap',
      symbols: [...by.sp500, ...by['us-total']],
      text: `${list('sp500')} (S&P 500) is mostly already inside ${list('us-total')} (total US market): the S&P 500 makes up roughly 80% of the US market by value.`,
    })
  }
  if (has('nasdaq100') && (has('sp500') || has('us-total'))) {
    const broad = [...(by.sp500 || []), ...(by['us-total'] || [])]
    out.push({
      kind: 'concentration',
      symbols: [...by.nasdaq100, ...broad],
      text: `The Nasdaq-100 companies in ${list('nasdaq100')} are already in ${broad.join(' and ')}, so holding both tilts you further toward the largest tech companies.`,
    })
  }
  // Individual stocks also owned through a broad index fund.
  const broadFunds = [...(by.sp500 || []), ...(by['us-total'] || []), ...(by['us-large'] || [])]
  const doubled = rows.filter((r) => SP500_GIANTS.has(r.symbol)).map((r) => r.symbol)
  if (broadFunds.length && doubled.length) {
    out.push({
      kind: 'in-index',
      symbols: [...doubled, ...broadFunds],
      text: `${joinList(doubled)} ${doubled.length === 1 ? 'is' : 'are'} also among the largest companies inside ${joinList(broadFunds)}, so you own ${doubled.length === 1 ? 'it' : 'them'} twice: directly and through the fund.`,
    })
  }

  // Concentration in individual companies.
  const total = rows.reduce((sum, r) => sum + (r.value || 0), 0)
  const stocks = rows.filter((r) => isIndividualStock(r))
  const stockShare = total > 0 ? stocks.reduce((sum, r) => sum + r.value, 0) / total : 0
  if (stocks.length && stockShare >= 0.25) {
    const big = stocks.filter((r) => r.value / total >= 0.1).map((r) => `${r.symbol} ${Math.round((r.value / total) * 100)}%`)
    out.push({
      kind: 'single-stocks',
      symbols: stocks.map((r) => r.symbol),
      text:
        `${Math.round(stockShare * 100)}% of this portfolio is in ${stocks.length} individual ${stocks.length === 1 ? 'company' : 'companies'}. ` +
        (big.length ? `Positions over 10%: ${big.join(', ')}. ` : '') +
        'A single company can fall much further, and stay down much longer, than the market as a whole.',
    })
  }

  if (has('target-date') && tracked.some((r) => r.tracks !== 'target-date')) {
    out.push({
      kind: 'target-date',
      symbols: by['target-date'],
      text: `${list('target-date')} is a target-date fund, built to be a whole portfolio on its own. Holding other funds alongside it changes the mix it was designed to keep.`,
    })
  }
  return out
}
