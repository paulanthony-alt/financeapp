import { describe, it, expect } from 'vitest'
import { portfolioIdeas } from './ideas.js'
import { summarizePortfolio } from './fidelity.js'
import { RISK_PROFILES } from './constants.js'
import { rebalanceWithContribution } from './rebalance.js'

const h = (symbol, description, value) => ({ symbol, description, value, quantity: 1 })
// Shaped like an "index fund + big tech" portfolio.
const techHeavy = summarizePortfolio([
  h('FXAIX', 'FIDELITY 500 INDEX FUND', 583),
  h('AMZN', 'AMAZON.COM INC', 370),
  h('MSFT', 'MICROSOFT CORP', 274),
  h('META', 'META PLATFORMS INC', 219),
  h('NVDA', 'NVIDIA CORPORATION COM', 210),
  h('TSLA', 'TESLA INC COM', 194),
  h('GOOGL', 'ALPHABET INC CAP STK CL A', 192),
  { symbol: 'CORE', description: 'HELD IN MONEY MARKET', value: 3, coreCash: true },
])
const ids = (ideas) => ideas.map((i) => i.id)

describe('portfolio ideas', () => {
  it('gives starter ideas when nothing is imported', () => {
    expect(ids(portfolioIdeas(null, null))).toEqual(['starter-core', 'starter-intl', 'starter-bonds'])
  })

  it('flags single-stock concentration, missing international, and the bond question', () => {
    const ideas = portfolioIdeas(techHeavy, null, 500)
    expect(ids(ideas)).toEqual(['diversify-singles', 'add-international', 'decide-bonds'])
    expect(ideas[0].why).toMatch(/^71% of your portfolio is in 6 individual companies/)
    expect(ideas[0].funds.map((f) => f.symbol)).toEqual(['FXAIX', 'FSKAX'])
    expect(ideas[1].funds.map((f) => f.symbol)).toEqual(['FTIHX', 'FZILX'])
    expect(ideas[1].why).toMatch(/^None of your stock money/)
  })

  it('sizes the bond idea from the target and the next contribution', () => {
    const ideas = portfolioIdeas(techHeavy, RISK_PROFILES.moderate, 500)
    const bonds = ideas.find((i) => i.id === 'add-bonds')
    // Cash is also under its 8% target, so the $500 is split between bonds and cash.
    const { buys } = rebalanceWithContribution(
      { Stocks: techHeavy.byClass.Stocks, Bonds: 0, Cash: techHeavy.byClass.Cash },
      RISK_PROFILES.moderate.allocation,
      500,
    )
    expect(Math.round(buys.Bonds)).toBeGreaterThan(300)
    expect(bonds.why).toContain(`Bonds are 0% of your portfolio versus your moderate target of 32%. Of your next $500, about $${Math.round(buys.Bonds)} would go to bonds.`)
    expect(ideas.find((i) => i.id === 'decide-bonds')).toBeUndefined()
  })

  it('suggests a cheaper fund and consolidating duplicates', () => {
    const s = summarizePortfolio([h('FFFHX', 'FIDELITY FREEDOM 2050', 1000), h('FXAIX', 'FIDELITY 500 INDEX FUND', 500), h('VOO', 'VANGUARD S&P 500 ETF', 500)])
    const got = ids(portfolioIdeas(s, null))
    expect(got).toContain('cheaper-FFFHX')
    expect(got).toContain('consolidate-FXAIX-VOO')
  })

  it('says stay the course for a diversified, on-target portfolio', () => {
    const s = summarizePortfolio([
      h('FSKAX', 'FIDELITY TOTAL MARKET INDEX', 4800),
      h('FTIHX', 'FIDELITY TOTAL INTERNATIONAL INDEX', 1200),
      h('FXNAX', 'FIDELITY US BOND INDEX FUND', 3200),
      { symbol: 'SPAXX', description: 'HELD IN MONEY MARKET', value: 800, coreCash: true },
    ])
    expect(ids(portfolioIdeas(s, RISK_PROFILES.moderate, 500))).toEqual(['stay-course'])
  })

  it('always explains each idea and what to weigh', () => {
    for (const i of [...portfolioIdeas(techHeavy, RISK_PROFILES.aggressive, 500), ...portfolioIdeas(null)]) {
      expect(i.why.length).toBeGreaterThan(20)
      expect(i.weigh.length).toBeGreaterThan(10)
      for (const f of i.funds) expect(typeof f.er).toBe('number')
    }
  })
})
