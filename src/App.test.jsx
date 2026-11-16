import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import App from './App.jsx'
import { currentMonthKey, shiftMonth } from './lib/period.js'

afterEach(cleanup)

const store = {
  set: (k, v) => window.localStorage.setItem(k, JSON.stringify(v)),
  get: (k) => JSON.parse(window.localStorage.getItem(k)),
}
const m0 = currentMonthKey()
const prev = shiftMonth(m0, -1)
const CATS = [
  { id: 'c1', name: 'Rent', limit: 1500 },
  { id: 'c2', name: 'Food', limit: 600 },
]

describe('app shell', () => {
  it('opens every tab without crashing', async () => {
    render(<App />)
    for (const [tab, heading] of [
      ['Investing', 'Investing'],
      ['Goals', 'Goals'],
      ['Net worth', 'Net worth'],
      ['Budget', 'Budget'],
    ]) {
      fireEvent.click(screen.getAllByRole('button', { name: new RegExp(tab) })[0])
      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy()
    }
  })
})

describe('budget months', () => {
  it('shows only the selected month and lets you go back', async () => {
    store.set('fp:budget:categories', CATS)
    store.set('fp:budget:transactions', [
      { id: 'a', date: `${m0}-01`, amount: 100, categoryId: 'c2', description: 'Groceries now' },
      { id: 'b', date: `${prev}-15`, amount: 40, categoryId: 'c2', description: 'Groceries before' },
    ])
    render(<App />)
    expect(await screen.findByText('Groceries now')).toBeTruthy()
    expect(screen.queryByText('Groceries before')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(await screen.findByText('Groceries before')).toBeTruthy()
    expect(screen.queryByText('Groceries now')).toBeNull()
    expect(screen.getByRole('button', { name: 'Next month' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Back to this month' }))
    expect(await screen.findByText('Groceries now')).toBeTruthy()
    // can't navigate past the current month
    expect(screen.getByRole('button', { name: 'Next month' }).disabled).toBe(true)
  })

  it('does not flag a category over budget because of earlier months', async () => {
    store.set('fp:budget:categories', [{ id: 'c2', name: 'Food', limit: 600 }])
    store.set('fp:budget:transactions', [
      { id: 'a', date: `${shiftMonth(m0, -2)}-05`, amount: 550, categoryId: 'c2', description: 'old' },
      { id: 'b', date: `${prev}-05`, amount: 550, categoryId: 'c2', description: 'old2' },
      { id: 'c', date: `${m0}-02`, amount: 50, categoryId: 'c2', description: 'new' },
    ])
    render(<App />)
    await screen.findByText('new')
    expect(screen.queryByText(/over budget/i)).toBeNull()
  })
})

describe('recurring transactions', () => {
  const rule = {
    id: 'r1', description: 'Rent', amount: 1500, categoryId: 'c1', dayOfMonth: 1,
    startMonth: shiftMonth(m0, -2), active: true, skipped: [],
  }

  it('creates a transaction for each due month, once', async () => {
    store.set('fp:budget:categories', CATS)
    store.set('fp:budget:recurring', [rule])
    render(<App />)
    await waitFor(() => expect(store.get('fp:budget:transactions')).toHaveLength(3))
    const months = store.get('fp:budget:transactions').map((t) => t.recurringMonth).sort()
    expect(months).toEqual([shiftMonth(m0, -2), prev, m0])
  })

  it('keeps a deleted occurrence deleted', async () => {
    store.set('fp:budget:categories', CATS)
    store.set('fp:budget:recurring', [rule])
    render(<App />)
    await waitFor(() => expect(store.get('fp:budget:transactions')).toHaveLength(3))

    const list = (await screen.findByText('Transactions')).closest('.card')
    fireEvent.click(within(list).getByRole('button', { name: 'Delete transaction' }))

    await waitFor(() => expect(store.get('fp:budget:transactions')).toHaveLength(2))
    expect(store.get('fp:budget:recurring')[0].skipped).toContain(m0)
    // give the sync effect a chance to (wrongly) recreate it
    await new Promise((r) => setTimeout(r, 50))
    expect(store.get('fp:budget:transactions')).toHaveLength(2)
  })
})

describe('goals from the budget', () => {
  it('moves money into a goal', async () => {
    const nextYear = new Date().getFullYear() + 1
    store.set('fp:goals', [{ id: 'g1', name: 'Emergency fund', target: 6000, saved: 2000, targetDate: `${nextYear}-01-01` }])
    render(<App />)
    fireEvent.change(await screen.findByLabelText('Amount to move'), { target: { value: '500' } })
    fireEvent.click(screen.getByRole('button', { name: 'Move' }))
    await waitFor(() => expect(store.get('fp:goals')[0].saved).toBe(2500))
    expect(await screen.findByRole('status')).toBeTruthy()
  })
})

describe('net worth', () => {
  it('adds assets and debts and saves a snapshot', async () => {
    store.set('fp:activeTab', 'networth')
    render(<App />)
    fireEvent.change(await screen.findByLabelText('Asset name'), { target: { value: 'Checking' } })
    fireEvent.change(screen.getByLabelText('Asset value'), { target: { value: '5000' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0])
    fireEvent.change(screen.getByLabelText('Debt name'), { target: { value: 'Car loan' } })
    fireEvent.change(screen.getByLabelText('Debt amount'), { target: { value: '2000' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[1])

    expect((await screen.findAllByText('$3,000')).length).toBeGreaterThan(0)
    await waitFor(() => {
      const h = store.get('fp:networth:history')
      expect(h).toHaveLength(1)
      expect(h[0]).toMatchObject({ assets: 5000, debts: 2000, net: 3000 })
    })
  })

  it('includes an imported Fidelity portfolio when asked', async () => {
    store.set('fp:activeTab', 'networth')
    store.set('fp:invest:portfolio', { holdings: [{ symbol: 'FXAIX', value: 1000 }, { symbol: 'FXNAX', value: 500 }] })
    render(<App />)
    const box = await screen.findByRole('checkbox')
    expect((await screen.findAllByText('$1,500')).length).toBeGreaterThan(0)
    fireEvent.click(box)
    await waitFor(() => expect(store.get('fp:networth:includeInvested')).toBe(false))
  })
})

describe('backup and restore', () => {
  it('restores a backup file, replacing existing data', async () => {
    const reload = vi.fn()
    const realLocation = window.location
    Object.defineProperty(window, 'location', { configurable: true, value: { ...realLocation, reload } })
    try {
      store.set('fp:budget:income', 111)
      render(<App />)
      fireEvent.click(screen.getAllByRole('button', { name: /Backup/ })[0])
      const backup = { app: 'finpilot', version: 1, exportedAt: '2026-11-01T00:00:00.000Z', data: { 'fp:budget:income': 9999 } }
      const file = new File([JSON.stringify(backup)], 'b.json', { type: 'application/json' })
      fireEvent.change(await screen.findByLabelText('Backup file'), { target: { files: [file] } })
      fireEvent.click(await screen.findByRole('button', { name: 'Replace my data' }))
      await waitFor(() => expect(reload).toHaveBeenCalled())
      expect(store.get('fp:budget:income')).toBe(9999)
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: realLocation })
    }
  })

  it('refuses a file that is not a FinPilot backup', async () => {
    render(<App />)
    fireEvent.click(screen.getAllByRole('button', { name: /Backup/ })[0])
    const file = new File(['{"hello":1}'], 'x.json', { type: 'application/json' })
    fireEvent.change(await screen.findByLabelText('Backup file'), { target: { files: [file] } })
    expect((await screen.findAllByText(/not a FinPilot backup/))[0]).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Replace my data' })).toBeNull()
  })
})
