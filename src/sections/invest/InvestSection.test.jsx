import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, within, cleanup, waitFor } from '@testing-library/react'
import InvestSection from './InvestSection.jsx'

afterEach(cleanup)

const store = {
  set: (k, v) => window.localStorage.setItem(k, JSON.stringify(v)),
  get: (k) => JSON.parse(window.localStorage.getItem(k)),
}
const holding = (symbol, description, value) => ({ symbol, description, value, quantity: 1, costBasis: null, costKnownValue: 0 })
function seedPortfolio(holdings) {
  store.set('fp:invest:portfolio', { fileName: 'p.csv', importedAt: '2026-11-16T00:00:00.000Z', accountCount: 1, holdings })
}
const cardFor = (title) => screen.getByText(title).closest('.card')

describe('rebalance with new money', () => {
  it('asks for a profile before giving a plan', () => {
    seedPortfolio([holding('FXAIX', 'FIDELITY 500 INDEX FUND', 1000)])
    render(<InvestSection />)
    expect(within(cardFor('Rebalance with new money')).getByText(/Pick a risk profile/)).toBeTruthy()
  })

  it('puts the contribution into the most underweight class and names a fund', () => {
    seedPortfolio([
      holding('FXAIX', 'FIDELITY 500 INDEX FUND', 8000),
      holding('FXNAX', 'FIDELITY US BOND INDEX FUND', 1000),
      holding('SPAXX', 'HELD IN MONEY MARKET', 1000),
    ])
    store.set('fp:invest:override', 'moderate') // 60 / 32 / 8
    render(<InvestSection />)
    const card = cardFor('Rebalance with new money')
    fireEvent.change(within(card).getByLabelText('I’m about to invest'), { target: { value: '500' } })
    const bonds = within(card).getByText('Bonds').closest('tr')
    expect(within(bonds).getByText('$500')).toBeTruthy()
    expect(within(bonds).getByText('e.g. add to FXNAX')).toBeTruthy()
    expect(within(within(card).getByText('Stocks').closest('tr')).getByText('—')).toBeTruthy()
    expect(within(card).getByText(/would take/)).toBeTruthy()
  })

  it('asks how stock-heavy multi-asset funds are', () => {
    seedPortfolio([holding('FFFHX', 'FIDELITY FREEDOM 2050', 1000)])
    store.set('fp:invest:override', 'moderate')
    render(<InvestSection />)
    expect(screen.getByLabelText('My target-date / balanced funds are about')).toBeTruthy()
  })
})

describe('fund costs and overlap', () => {
  it('shows overlap, cheaper alternatives, and saves an entered expense ratio', async () => {
    seedPortfolio([
      holding('FXAIX', 'FIDELITY 500 INDEX FUND', 10000),
      holding('FSKAX', 'FIDELITY TOTAL MARKET INDEX', 10000),
      holding('FFFHX', 'FIDELITY FREEDOM 2050', 10000),
      holding('MYSTERY', 'SOME FUND', 5000),
    ])
    render(<InvestSection />)
    const card = cardFor('Fund costs and overlap')
    expect(within(card).getByText(/roughly 80% of the US market/)).toBeTruthy()
    expect(within(card).getByText(/target-date fund, built to be a whole portfolio/)).toBeTruthy()
    expect(within(card).getByText(/Freedom Index 2050 \(FIPFX\)/)).toBeTruthy()
    expect(within(card).getByText(/86% of portfolio has a known cost/)).toBeTruthy()

    fireEvent.change(within(card).getByLabelText('Expense ratio for MYSTERY'), { target: { value: '0.5' } })
    await waitFor(() => expect(store.get('fp:invest:erOverrides')).toEqual({ MYSTERY: 0.5 }))
    expect(within(card).getByText('entered by you')).toBeTruthy()
  })
})

describe('growth projection', () => {
  it('computes a retirement target and the odds of reaching it', () => {
    render(<InvestSection />)
    fireEvent.change(screen.getByLabelText('Yearly spending in retirement'), { target: { value: '50000' } })
    expect(screen.getByText('$1,250,000')).toBeTruthy()
    expect(screen.getByText(/Chance by year 25/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Withdrawal rate'), { target: { value: '5' } })
    expect(screen.getByText('$1,000,000')).toBeTruthy()
  })

  it('says when a far-off target would be reached, past the horizon', () => {
    store.set('fp:invest:calc', { principal: 50000, monthly: 600, years: 25, rate: 6.5, retireSpending: 60000, withdrawal: 4, age: 35 })
    render(<InvestSection />)
    const stat = screen.getByText('Typical path reaches it').parentElement
    expect(within(stat).getByText(/^Year \d+$/)).toBeTruthy()
    expect(within(stat).getByText(/at age \d+, past your 25-year horizon/)).toBeTruthy()
  })

  it('shows a range by default and can switch it off', () => {
    render(<InvestSection />)
    expect(screen.getByText('Typical result')).toBeTruthy()
    expect(screen.getByText(/1 in 10 outcomes below/)).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Show a range of outcomes'))
    expect(screen.queryByText('Typical result')).toBeNull()
    expect(screen.getByText('Final balance')).toBeTruthy()
  })

  it('reports in today’s dollars by default, and nominal when unticked', () => {
    store.set('fp:invest:calc', { principal: 1000, monthly: 0, years: 10, rate: 5, showRange: false })
    render(<InvestSection />)
    // $1,000 at 5% for 10 years = $1,647 nominal; / 1.025^10 = $1,287 today
    expect(screen.getAllByText('$1,287').length).toBeGreaterThan(0)
    fireEvent.click(screen.getByLabelText('Show in today’s dollars'))
    expect(screen.getAllByText('$1,647').length).toBeGreaterThan(0)
  })
})
