import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal.jsx'

const blank = (categories, startMonth) => ({
  description: '',
  amount: '',
  categoryId: categories[0]?.id || '',
  dayOfMonth: '1',
  startMonth,
})

export default function RecurringModal({ open, editing, categories, currentMonth, onClose, onSave }) {
  const [form, setForm] = useState(blank(categories, currentMonth))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      editing
        ? {
            description: editing.description,
            amount: String(editing.amount),
            categoryId: editing.categoryId,
            dayOfMonth: String(editing.dayOfMonth),
            startMonth: editing.startMonth,
          }
        : blank(categories, currentMonth),
    )
    setError('')
  }, [open, editing, categories, currentMonth])

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    const day = Math.round(Number(form.dayOfMonth))
    if (!form.description.trim()) return setError('Give this a name, like “Rent” or “Netflix”.')
    if (!(amount > 0)) return setError('Enter an amount greater than zero.')
    if (!form.categoryId) return setError('Pick a category.')
    if (!(day >= 1 && day <= 31)) return setError('Day of month must be between 1 and 31.')
    if (!/^\d{4}-\d{2}$/.test(form.startMonth)) return setError('Pick a start month.')
    onSave({
      id: editing?.id,
      description: form.description.trim(),
      amount: Math.round(amount * 100) / 100,
      categoryId: form.categoryId,
      dayOfMonth: day,
      startMonth: form.startMonth,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit recurring' : 'New recurring transaction'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="rec-desc">Name</label>
          <input id="rec-desc" className="input" placeholder="e.g. Rent" value={form.description} onChange={update('description')} autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="rec-amount">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input id="rec-amount" className="input pl-7" type="number" min="0" step="0.01" value={form.amount} onChange={update('amount')} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="rec-day">Day of month</label>
            <input id="rec-day" className="input" type="number" min="1" max="31" value={form.dayOfMonth} onChange={update('dayOfMonth')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="rec-cat">Category</label>
            <select id="rec-cat" className="input" value={form.categoryId} onChange={update('categoryId')}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="rec-start">Starting</label>
            <input id="rec-start" className="input" type="month" value={form.startMonth} onChange={update('startMonth')} />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          A transaction is added automatically on this day each month. Day 31 uses the last day of shorter months.
        </p>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{editing ? 'Save changes' : 'Add recurring'}</button>
        </div>
      </form>
    </Modal>
  )
}
