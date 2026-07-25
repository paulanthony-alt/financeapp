import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui/Modal.jsx'

const blank = (date, categories) => ({
  description: '',
  amount: '',
  categoryId: categories[0]?.id || '',
  date,
})

export default function TransactionModal({
  open,
  editing,
  categories,
  defaultDate,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(blank(defaultDate, categories))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        description: editing.description || '',
        amount: String(editing.amount),
        categoryId: editing.categoryId,
        date: editing.date,
      })
    } else {
      setForm(blank(defaultDate, categories))
    }
    setError('')
  }, [open, editing, defaultDate, categories])

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!(amount > 0)) return setError('Enter an amount greater than zero.')
    if (!form.categoryId) return setError('Pick a category.')
    onSave({
      id: editing?.id,
      description: form.description.trim(),
      amount: Math.round(amount * 100) / 100,
      categoryId: form.categoryId,
      date: form.date,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit transaction' : 'Add transaction'}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            placeholder="e.g. Grocery run"
            value={form.description}
            onChange={update('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                className="input pl-7"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={update('amount')}
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={update('date')} />
          </div>
        </div>

        <div>
          <label className="label">Category</label>
          <select className="input" value={form.categoryId} onChange={update('categoryId')}>
            {categories.length === 0 && <option value="">No categories — add one first</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {editing ? 'Save changes' : 'Add transaction'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
